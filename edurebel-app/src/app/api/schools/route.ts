// file: src/app/api/schools/route.ts
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: auth } },
      auth: { persistSession: false }
    }
  )
  const { data, error } = await supabase.from('schools').select('id,name,short_code')
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}
