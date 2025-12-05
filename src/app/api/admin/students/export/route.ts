import { requireAdmin } from "../../../../../lib/admin-auth"
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'

function parseLimit(v: string | null, def = 10000, max = 50000) {
  const n = Number(v ?? def)
  if (!Number.isFinite(n) || n <= 0) return def
  return Math.min(Math.floor(n), max)
}
function parseOrder(v: string | null) {
  const s = (v ?? '').trim() || 'created_at.desc'
  const [col, dir] = s.split('.', 2)
  const allowedCols = new Set(['created_at','full_name','id'])
  const allowedDir = new Set(['asc','desc'])
  const c = allowedCols.has(col) ? col : 'created_at'
  const d = allowedDir.has(dir ?? '') ? (dir as 'asc'|'desc') : 'desc'
  return { col: c, dir: d }
}

export async function GET(req: Request) {
  const gate = requireAdmin(req)
  if (!gate.ok) return Response.json({ ok:false, error:gate.error }, { status: gate.status })

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const svcKey = (process.env.SUPABASE_SERVICE_ROLE ?? '').trim()
  if (!supabaseUrl || !svcKey) return Response.json({ ok:false, error:'Missing service env' }, { status: 500 })

  const u = new URL(req.url)
  const pattern = (u.searchParams.get('pattern') ?? '').trim()
  const from = u.searchParams.get('created_from')
  const to   = u.searchParams.get('created_to')
  const schoolShort = (u.searchParams.get('school') ?? '').trim()
  const schoolIdQ   = (u.searchParams.get('school_id') ?? '').trim()
  const limit = parseLimit(u.searchParams.get('limit'))
  const { col, dir } = parseOrder(u.searchParams.get('order'))

  const sb = createClient(supabaseUrl, svcKey, { auth: { persistSession: false } })

  // resolve school_id if short_code provided
  let schoolId = schoolIdQ
  if (!schoolId && schoolShort) {
    const { data: sch, error: schErr } = await sb
      .from('schools').select('id').eq('short_code', schoolShort).limit(1).single()
    if (schErr) return Response.json({ ok:false, error: schErr.message }, { status: 500 })
    schoolId = sch?.id ?? ''
  }

  let q = sb.from('students')
    .select('id,school_id,full_name,created_at')
    .order(col, { ascending: dir === 'asc' })

  if (pattern) q = q.ilike('full_name', pattern)
  if (from) q = q.gte('created_at', from)
  if (to)   q = q.lte('created_at', to)
  if (schoolId) q = q.eq('school_id', schoolId)
  q = q.limit(limit)

  const { data, error } = await q
  if (error) return Response.json({ ok:false, error: error.message }, { status: 500 })

  const header = 'id,school_id,full_name,created_at\n'
  const rows = (data ?? []).map(r =>
    [r.id, r.school_id, (r.full_name ?? '').replaceAll('"','""'), r.created_at]
      .map((v,i)=> i===2 ? `"${v}"` : `${v}`).join(',')
  ).join('\n')
  const csv = header + rows + '\n'
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="students.csv"'
    }
  })
}
