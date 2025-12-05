// src/app/api/rooms/[id]/messages/route.ts
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;               // <- await it
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return Response.json({ error: 'Missing Bearer token' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: auth } } }
  );

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 100);

  const { data, error } = await supabase
    .from('messages')
    .select('id,user_id,content,inserted_at')
    .eq('room_id', id)
    .order('inserted_at', { ascending: false })
    .limit(limit);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;               // <- await it
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return Response.json({ error: 'Missing Bearer token' }, { status: 401 });
  }

  const { content } = await req.json().catch(() => ({}));
  if (!content || !String(content).trim()) {
    return Response.json({ error: 'content required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: auth } } }
  );

  // derive user_id from JWT (best-effort; RLS still enforces)
  let user_id = '';
  try {
    const jwt = auth.split(' ')[1];
    user_id = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString()).sub;
  } catch {}

  const { data, error } = await supabase
    .from('messages')
    .insert({ room_id: id, user_id, content: String(content).slice(0, 4000) })
    .select('id,inserted_at')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, id: data.id, inserted_at: data.inserted_at }, { status: 201 });
}
