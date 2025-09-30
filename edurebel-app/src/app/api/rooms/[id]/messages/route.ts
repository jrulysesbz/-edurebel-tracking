import { NextResponse } from 'next/server'
import { z } from 'zod'

// Minimal body schema – expand as needed
const MessageSchema = z.object({
  text: z.string().min(1),
  authorId: z.string().optional(),
})

type MessageBody = z.infer<typeof MessageSchema>

export async function POST(req: Request, { params }: { params: Record<string, string | string[]> }) {
  const body: MessageBody = MessageSchema.parse(await req.json())
  const roomId = (params.id as string)
  // TODO: persist { ...body, roomId }
  return NextResponse.json({ ok: true })
}

export async function GET(_req: Request, { params }: { params: Record<string, string | string[]> }) {
  const roomId = (params.id as string)
  // TODO: fetch messages for roomId
  return NextResponse.json([])
}
