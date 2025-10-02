// src/app/api/health/route.ts
export async function GET() {
  // unauthenticated fast probe
  return Response.json({ ok: true, ts: Date.now() });
}
