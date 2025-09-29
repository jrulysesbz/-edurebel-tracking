import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const h = await headers()
    const auth = h.get('authorization') || ''
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: auth } } }
    )
    const { data, error } = await supabase.from('schools').select('id,name,short_code').limit(10)
    if (error) throw error
    return new Response(JSON.stringify({ data }), { headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), { status: 500 })
  }
}
