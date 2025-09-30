import { NextResponse } from 'next/server';
import { z } from 'zod';

const MessageBody = z.object({
  text: z.string().min(1),
  authorId: z.string(),
});
type MessageBody = z.infer<typeof MessageBody>;

export async function POST(
  req: ctx: { params: { id: string } }
) {
  const body = MessageBody.parse(await req.json());
  const roomId = params.id;
  // TODO: persist message { ...body, roomId }
  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: ctx: { params: { id: string } }
) {
  const roomId = params.id;
  // TODO: fetch messages for roomId
  return NextResponse.json([]);
}
