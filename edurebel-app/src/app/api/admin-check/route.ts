import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const expected = process.env.ADMIN_BEARER_TOKEN;

  if (!expected) {
    return NextResponse.json({ error: 'Server misconfig: ADMIN_BEARER_TOKEN not set' }, { status: 500 });
  }
  if (token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
