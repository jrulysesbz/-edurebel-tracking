import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data, error } = await supabase
      .from('schools')
      .select('id,name,short_code')
      .limit(10);
    if (error) throw error;
    return Response.json({ data });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500, headers: { 'content-type': 'application/json' },
    });
  }
}
