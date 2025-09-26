import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return Response.json({ error: 'Missing Bearer token' }, { status: 401 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: auth } } });
  const { data, error } = await supabase
    .from('rooms')
    .select('id,name,school_id,meeting_url,created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return Response.json({ error: 'Missing Bearer token' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { school_id, name, meeting_url } = body ?? {};
  if (!school_id || !name) return Response.json({ error: 'school_id and name required' }, { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: auth } } });

  // whoami via profiles
  const { data: me } = await supabase.from('profiles').select('user_id').eq('user_id', (await (async()=>{const jwt=auth.split(' ')[1]; try{const p=JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString()); return p.sub;}catch{return '';}})())).single();

  const { data, error } = await supabase.from('rooms').insert({
    school_id, name, meeting_url: meeting_url ?? null, created_by: me?.user_id ?? null
  }).select('id').single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // auto-add creator as owner member (best-effort)
  if (data?.id && me?.user_id) {
    await supabase.from('room_members').insert({ room_id: data.id, user_id: me.user_id, role: 'owner' });
  }
  return Response.json({ id: data?.id });
}
