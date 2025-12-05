// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/api/admin/:path*'], // protect only admin routes
};

export function middleware(req: NextRequest) {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;

  const expected = process.env.ADMIN_BEARER_TOKEN; // same env var as admin-check
  if (!expected) {
    return new NextResponse(
      JSON.stringify({ error: 'Server misconfig: ADMIN_BEARER_TOKEN not set' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
  if (token !== expected) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'content-type': 'application/json' } },
    );
  }
  return NextResponse.next();
}
