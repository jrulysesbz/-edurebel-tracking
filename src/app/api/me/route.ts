// src/app/api/me/route.ts
import { NextResponse } from 'next/server';
import { env } from '../../../lib/env';

/**
 * Returns the caller's role from public.profiles, RLS-first.
 * - If the browser sends its JWT in Authorization, REST sees the user and returns their own row.
 * - If no auth is present, you'll typically get role=null (no row visible).
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || undefined;
  const url = `${env.SUPABASE_URL}/rest/v1/profiles?select=role&limit=1`;

  const res = await fetch(url, {
    headers: {
      apikey: env.ANON,
      Authorization: auth || `Bearer ${env.ANON}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(JSON.stringify({ ok: false, error: text }), {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  const rows = (await res.json()) as Array<{ role: string }>;
  const role = rows?.[0]?.role ?? null;
  return NextResponse.json({ ok: true, role });
}
