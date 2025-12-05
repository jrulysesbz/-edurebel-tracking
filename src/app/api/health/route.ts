export const runtime = 'nodejs';
export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
// src/app/api/health/route.ts
export async function GET() {
  // why: keep health unauthenticated and fast
  return Response.json({ ok: true, ts: Date.now() });
}

