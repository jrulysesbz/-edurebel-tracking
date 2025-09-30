// file: src/app/api/students/route.ts
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

function sb(auth: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false }
    }
  )
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const supabase = sb(auth)
  const { data, error } = await supabase
    .from('students')
    .select('id,school_id,full_name,created_at')
    .order('created_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') ?? ''
    const supabase = sb(auth)

    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('school_id')
      .single()
    if (profErr || !prof?.school_id) {
      return Response.json({ error: 'No profile/school found for user' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const full_name = (body.full_name ?? '').trim()
    if (!full_name) return Response.json({ error: 'full_name is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('students')
      .insert({ full_name, school_id: prof.school_id })
      .select('*')
      .single()

    if (error) throw error
    return Response.json({ data }, { status: 201, headers: { 'content-type': 'application/json' } })
  } catch (e : unknown) {
    return Response.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
