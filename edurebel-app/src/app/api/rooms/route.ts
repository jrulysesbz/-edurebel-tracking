// src/app/api/rooms/route.ts
import { NextRequest } from 'next/server';
import { createSupabaseForRequest } from '@/lib/supabaseServer';

function bad(msg: string, status = 400): Response {
  return Response.json({ error: msg }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseForRequest(req);
    const url = new URL(req.url);
    const schoolId = url.searchParams.get('school_id') ?? undefined;
    const name = url.searchParams.get('name') ?? undefined;

    let q = supabase
      .from('rooms')
      .select('id,name,school_id,meeting_url,created_by,inserted_at')
      .order('inserted_at', { ascending: false });

    if (schoolId) q = q.eq('school_id', schoolId);
    if (name) q = q.ilike('name', name);

    const { data, error } = await q;
    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return bad(msg, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseForRequest(req);
    const body = await req.json().catch(() => ({}));
    const name: string | undefined = body?.name;
    const school_id: string | undefined = body?.school_id;
    if (!name || !school_id) return bad('name and school_id are required');

    // 1) Try insert
    const { data: created, error: insertErr } = await supabase
      .from('rooms')
      .insert([{ name, school_id }])
      .select('id,name,school_id,meeting_url,created_by,inserted_at')
      .single();

    if (!insertErr) {
      return Response.json({ data: created, meta: { created: true } });
    }

    // 2) Unique violation → fetch existing (idempotent)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pgCode = (insertErr as any)?.code ?? '';
    if (pgCode === '23505') {
      const { data: existing, error: selErr } = await supabase
        .from('rooms')
        .select('id,name,school_id,meeting_url,created_by,inserted_at')
        .eq('school_id', school_id)
        .ilike('name', name)
        .order('inserted_at', { ascending: false })
        .limit(1)
        .single();
      if (selErr) throw selErr;
      return Response.json({ data: existing, meta: { conflict: true } });
    }

    // 3) Other errors
    return bad(typeof insertErr === 'object' ? JSON.stringify(insertErr) : String(insertErr), 500);
  } catch (e) {
    return bad(e instanceof Error ? e.message : String(e), 500);
  }
}
