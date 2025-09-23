import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const token = req.headers.get('authorization') || '';
  const r = await fetch(`${url}/functions/v1/risk-scan?limit=10`, {
    headers: { authorization: token },
    // optionally: cache: 'no-store'
  });
  const body = await r.text();
  return new NextResponse(body, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') || 'application/json' },
  });
}
