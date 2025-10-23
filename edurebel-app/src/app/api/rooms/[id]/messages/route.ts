/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { z } from 'zod'

const MessageSchema = z.object({
  text: z.string().min(1),
  authorId: z.string().optional(),
})
type MessageBody = z.infer<typeof MessageSchema>

function extractRoomId(url: string): string {
  const m = new URL(url)
  const match = m.pathname.match(/\/rooms\/([^/]+)\/messages(?:\/)?$/)
  if (!match) throw new Error('Invalid route: missing room id')
  return match[1]
}

export async function POST(req: Request) {
  const _body : MessageBody = MessageSchema.parse(await req.json())
  const _roomId = extractRoomId(req.url)
  // TODO: persist { ...body, roomId }
  return NextResponse.json({ ok: true })
}

export async function GET(req: Request) {
  const roomId = extractRoomId(req.url)
  // TODO: fetch messages for roomId
  return NextResponse.json([])
}
