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

    // Works both before and after DB migration:
    // 1) Try plain insert.
    const ins = await supabase
      .from('rooms')
      .insert([{ name, school_id }])
      .select('id,name,school_id,meeting_url,created_by,inserted_at')
      .single();

    if (!ins.error) {
      return Response.json({ data: ins.data, meta: { created: true } });
    }

    // 2) If unique violation, fetch existing (idempotent).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const code = (ins.error as any)?.code ?? '';
    if (code === '23505') {
      const sel = await supabase
        .from('rooms')
        .select('id,name,school_id,meeting_url,created_by,inserted_at')
        .eq('school_id', school_id)
        .ilike('name', name)
        .order('inserted_at', { ascending: false })
        .limit(1)
        .single();
      if (sel.error) throw sel.error;
      return Response.json({ data: sel.data, meta: { conflict: true } });
    }

    // 3) Other errors → surface clearly.
    return bad(typeof ins.error === 'object' ? JSON.stringify(ins.error) : String(ins.error), 500);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return bad(msg, 500);
  }
}
