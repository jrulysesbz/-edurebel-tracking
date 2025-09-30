// file: src/middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  const expected = (process.env.ADMIN_BEARER_TOKEN ?? '').trim()

  if (!expected || token.trim() !== expected) {
    return new NextResponse(JSON.stringify({ ok:false, error:'Unauthorized' }), {
      status: 401, headers: { 'content-type': 'application/json' }
    })
  }
  return NextResponse.next()
}

export const config = { matcher: ['/api/admin/:path*'] }
