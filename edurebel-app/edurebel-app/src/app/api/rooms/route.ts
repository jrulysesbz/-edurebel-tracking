import { z } from 'zod'
import { createSupabaseForRequest } from '@/lib/supabaseServer'

const NewRoomSchema = z.object({
  name: z.string().min(1).max(200),
  school_id: z.string().uuid().optional(),
  meeting_url: z.string().url().optional(),
  created_by: z.string().uuid().optional(),
})

export async function GET(req: Request) {
  try {
    const supabase = createSupabaseForRequest(req)
    const { data, error } = await supabase
      .from('rooms')
      .select('id,name,school_id,meeting_url,created_by,inserted_at')
      .order('inserted_at', { ascending: false })
    if (error) throw error
    return Response.json({ data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e))
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseForRequest(req)
    const input = NewRoomSchema.parse(await req.json())

    const insert: Record<string, unknown> = { name: input.name }
    if (input.school_id) insert.school_id = input.school_id
    if (input.meeting_url) insert.meeting_url = input.meeting_url
    if (input.created_by) insert.created_by = input.created_by

    const { data, error } = await supabase
      .from('rooms')
      .insert(insert)
      .select('id,name,school_id,meeting_url,created_by,inserted_at')
      .single()
    if (error) throw error
    return Response.json({ data }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e))
    return Response.json({ error: msg }, { status: 400 })
  }
}
