import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return Response.json({ error: 'Missing Bearer token' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: auth } } }
    );

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 100);

    const { data, error } = await supabase
      .from('rooms')
      .select('id,name,meeting_url,created_by')   // 👈 no created_at
      .order('name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return Response.json({ data });
  } catch (e) {
    return Response.json({ error: (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}
