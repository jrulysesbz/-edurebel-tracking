import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../lib/env';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${env.FUNCTIONS_BASE}/get-report-url`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SERVICE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
