import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const auth = (await headers()).get('authorization') ?? ''
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: auth } } }
    )
    const { data, error } = await supabase.from('students').select('*').limit(50)
    if (error) throw error
    return new Response(JSON.stringify({ data }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = (await headers()).get('authorization') ?? ''
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: auth } } }
    )

    const body = await req.json().catch(() => ({} as any))
    const full_name: string = body.full_name
    const school_id: string | undefined = body.school_id

    if (!full_name || !school_id) {
      return new Response(JSON.stringify({ error: 'full_name and school_id are required' }), { status: 400 })
    }

    const { data, error } = await supabase
      .from('students')
      .insert({ full_name, school_id })
      .select('*')
      .single()

    if (error) throw error
    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 500 })
  }
}
