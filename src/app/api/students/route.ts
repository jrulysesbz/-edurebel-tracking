import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Helper to create a Supabase client that forwards the caller's Bearer token
function supaFromRequest(authHeader: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader ?? '' } },
  });
}

export async function GET() {
  try {
    const auth = (await headers()).get('authorization') ?? '';
    const supabase = supaFromRequest(auth);

    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, school_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = (await headers()).get('authorization') ?? '';
    const supabase = supaFromRequest(auth);

    const body = await req.json().catch(() => ({}));
    const full_name = String(body.full_name ?? '').trim();
    if (!full_name) {
      return new Response(JSON.stringify({ error: 'full_name is required' }), { status: 400 });
    }

    // infer school_id from caller's profile (RLS-friendly)
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('school_id')
      .limit(1)
      .single();

    if (profErr || !prof?.school_id) {
      return new Response(JSON.stringify({ error: 'No profile/school found for current user' }), { status: 403 });
    }

    const { data, error } = await supabase
      .from('students')
      .insert({ full_name, school_id: prof.school_id })
      .select('*')
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    // Optional: console.error('POST /api/students failed:', e);
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 500 });
  }
}
