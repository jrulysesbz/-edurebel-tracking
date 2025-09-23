import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.headers.get('authorization') || ''
  if (token !== `Bearer ${process.env.SECRET_TOKEN}`) {
    return new NextResponse(JSON.stringify({ ok:false, error:'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' }
    })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/:path*'], // only protects admin endpoints
}
