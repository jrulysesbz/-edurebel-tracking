import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MessageBody = z.object({
  text: z.string().min(1),
  authorId: z.string(),
});
type MessageBody = z.infer<typeof MessageBody>;

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const body = MessageBody.parse(await req.json());
  const roomId = ctx.params.id;
  // TODO: persist message { ...body, roomId }
  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const roomId = ctx.params.id;
  // TODO: fetch messages for roomId
  return NextResponse.json([]);
}
