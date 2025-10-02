import { createSupabaseForRequest } from '@/lib/supabaseServer';
export async function GET(req: Request) {
  try {
    const supabase = createSupabaseForRequest(req);
    const { data, error } = await supabase
      .from('schools')
      .select('id,name,short_code,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
