import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET() {
  const { data: classes, error: cErr } = await supabaseAdmin
    .from('classes')
    .select('id, name')
    .order('name')
    .limit(50)

  const { data: schools, error: sErr } = await supabaseAdmin
    .from('schools')
    .select('id, name')
    .order('name')
    .limit(50)

  if (cErr || sErr) {
    return NextResponse.json({ ok: false, error: (cErr || sErr)?.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, classes, schools })
}
