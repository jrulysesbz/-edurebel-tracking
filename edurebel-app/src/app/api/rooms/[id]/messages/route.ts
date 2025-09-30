import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 200);
    const { data, error } = await supabase
      .from('messages')
      .select('id,user_id,content,inserted_at')
      .eq('room_id', (await params).id)
      .order('inserted_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return Response.json({ data });
  } catch (e : unknown) {
    return Response.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return Response.json({ error: 'Missing Bearer token' }, { status: 401 });
  }
  try {
    const { content } = await req.json().catch(() => ({}));
    if (!content || !String(content).trim()) {
      return Response.json({ error: 'content required' }, { status: 400 });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: auth } } }
    );
    const jwt = auth.split(' ')[1];
    let user_id = '';
    try { user_id = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString()).sub; } catch {}
    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: (await params).id, user_id, content: String(content).slice(0, 4000) })
      .select('id,inserted_at')
      .single();
    if (error) throw error;
    return Response.json({ ok: true, id: data.id, inserted_at: data.inserted_at }, { status: 201 });
  } catch (e : unknown) {
    return Response.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
