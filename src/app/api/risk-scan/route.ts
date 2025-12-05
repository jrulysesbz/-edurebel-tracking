import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../lib/env';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ?? '10';
  const res = await fetch(`${env.FUNCTIONS_BASE}/risk-scan?limit=${encodeURIComponent(limit)}`, {
    headers: { Authorization: `Bearer ${env.SERVICE}` },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
