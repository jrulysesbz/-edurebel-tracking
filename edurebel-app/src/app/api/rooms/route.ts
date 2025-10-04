// src/app/api/rooms/route.ts
import { NextRequest } from 'next/server';
import { createSupabaseForRequest } from '@/lib/supabaseServer';

function bad(msg: string, status = 400): Response {
  return Response.json({ error: msg }, { status });
}
const isNameCiMissing = (e: unknown) => {
  const s = typeof e === 'string' ? e : JSON.stringify(e);
  return /name_ci|42703|undefined column|onConflict/.test(s || '');
};

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
    if (name) q = q.ilike('name', name); // case-insensitive

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

    // --- Preferred path: single-call UPSERT using unique (school_id, name_ci)
    const { data: upserted, error: upsertErr } = await supabase
      .from('rooms')
      .upsert([{ name, school_id }], { onConflict: 'school_id,name_ci' })
      .select('id,name,school_id,meeting_url,created_by,inserted_at')
      .order('inserted_at', { ascending: false })
      .limit(1)
      .single();

    if (!upsertErr) {
      return Response.json({ data: upserted, meta: { upsert: true } });
    }

    // --- Fallback: DB missing name_ci or conflict target → use insert+select
    if (isNameCiMissing(upsertErr)) {
      // 1) Attempt insert
      const { data: created, error: insertErr } = await supabase
        .from('rooms')
        .insert([{ name, school_id }])
        .select('id,name,school_id,meeting_url,created_by,inserted_at')
        .single();

      if (!insertErr) {
        return Response.json({ data: created, meta: { created: true, fallback: true } });
      }

      // 2) Unique violation → fetch existing (idempotent)
      const pgCode = (insertErr as unknown as { code?: string })?.code ?? '';
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
        return Response.json({ data: existing, meta: { conflict: true, fallback: true } });
      }

      // 3) Other insert error
      return bad(typeof insertErr === 'object' ? JSON.stringify(insertErr) : String(insertErr), 500);
    }

    // Non-name_ci UPSERT error
    return bad(typeof upsertErr === 'object' ? JSON.stringify(upsertErr) : String(upsertErr), 500);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return bad(msg, 500);
  }
}
