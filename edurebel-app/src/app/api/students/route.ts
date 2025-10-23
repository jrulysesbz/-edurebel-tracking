import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../lib/env';

export async function GET(req: NextRequest) {
  const { search } = new URL(req.url);
  const url = `${env.SUPABASE_URL}/rest/v1/students${search || '?select=id'}`;
  const res = await fetch(url, {
    headers: {
      apikey: env.ANON,
      Authorization: `Bearer ${env.SERVICE}`,
    },
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  });
}
