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
    return bad(e instanceof Error ? e.message : String(e), 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseForRequest(req);
    const body = await req.json().catch(() => ({}));
    const name: string | undefined = body?.name;
    const school_id: string | undefined = body?.school_id;
    if (!name || !school_id) return bad('name and school_id are required');

    // Single-call idempotency (requires unique index on (school_id, name_ci))
    const { error: upsertErr } = await supabase
      .from('rooms')
      .upsert(
        [{ name, school_id }],
        { onConflict: 'school_id,name_ci', ignoreDuplicates: true }
      );
    if (upsertErr) throw upsertErr;

    // Return the row (works for both insert & duplicate)
    const { data, error: selErr } = await supabase
      .from('rooms')
      .select('id,name,school_id,meeting_url,created_by,inserted_at')
      .eq('school_id', school_id)
      .ilike('name', name)
      .limit(1)
      .single();
    if (selErr) throw selErr;

    return Response.json({ data, meta: { conflict: true } });
  } catch (e) {
    return bad(e instanceof Error ? e.message : String(e), 500);
  }
}
