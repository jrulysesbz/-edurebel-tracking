// file: src/app/api/admin/students/cleanup/route.ts
import { requireAdmin } from "../../../../../lib/admin-auth"
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const gate = requireAdmin(req)
  if (!gate.ok) return Response.json({ ok:false, error:gate.error }, { status: gate.status })

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const svcKey = (process.env.SUPABASE_SERVICE_ROLE ?? '').trim()
  if (!supabaseUrl || !svcKey) return Response.json({ ok:false, error:'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE' }, { status: 500 })

  const body = await req.json().catch(() => ({})) as { pattern?: string; dryRun?: boolean; confirm?: string }
  const pattern = (body.pattern ?? '').trim()
  const dryRun = Boolean(body.dryRun)
  const confirm = (body.confirm ?? '').trim()

  if (!pattern) return Response.json({ ok:false, error:'pattern required' }, { status: 400 })
  if (!pattern.includes('Seeded')) return Response.json({ ok:false, error:'Refuse broad delete; include "Seeded" in pattern' }, { status: 400 })
  if (!dryRun && confirm !== pattern) {
    return Response.json({ ok:false, error:'confirm must exactly match pattern when deleting' }, { status: 400 })
  }

  const sb = createClient(supabaseUrl, svcKey, { auth: { persistSession: false } })

  if (dryRun) {
    const { data, error } = await sb.from('students').select('id,full_name').ilike('full_name', pattern).limit(100)
    if (error) return Response.json({ ok:false, error: error.message }, { status: 500 })
    return Response.json({ ok:true, dryRun:true, matches: data?.length ?? 0, sample: data })
  }

  const { data, error } = await sb.from('students').delete().ilike('full_name', pattern).select('id,full_name')
  if (error) return Response.json({ ok:false, error: error.message }, { status: 500 })
  return Response.json({ ok:true, deleted: data?.length ?? 0, sample: (data ?? []).slice(0,5) })
}
