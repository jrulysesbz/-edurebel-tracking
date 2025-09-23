import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('id, first_name, last_name, class_id, school_id')
    .order('last_name', { ascending: true })
    .limit(200)
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  return NextResponse.json({ ok:true, rows:data }, { status:200 })
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { first_name, last_name, class_id, school_id } = body || {}
    if (!first_name || !last_name || !class_id || !school_id) {
      return NextResponse.json({ ok:false, error:'Missing required fields' }, { status:400 })
    }
    const { data, error } = await supabaseAdmin
      .from('students')
      .insert([{ first_name, last_name, class_id, school_id }])
      .select('id, first_name, last_name, class_id, school_id')
      .single()
    if (error) throw error
    return NextResponse.json({ ok:true, student:data }, { status:201 })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || String(e) }, { status:500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id, ...fields } = body || {}
    if (!id) return NextResponse.json({ ok:false, error:'Missing id' }, { status:400 })
    const { data, error } = await supabaseAdmin
      .from('students')
      .update(fields)
      .eq('id', id)
      .select('id, first_name, last_name, class_id, school_id')
      .single()
    if (error) throw error
    return NextResponse.json({ ok:true, student:data }, { status:200 })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || String(e) }, { status:500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ ok:false, error:'Missing id' }, { status:400 })
  const { error } = await supabaseAdmin.from('students').delete().eq('id', id)
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  return NextResponse.json({ ok:true }, { status:200 })
}
