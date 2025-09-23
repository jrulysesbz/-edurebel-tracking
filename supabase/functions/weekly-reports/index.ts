import { requireJWT, cors } from '../_shared/util.ts';
Deno.serve(async (req) => {
  // --- CORS preflight ---
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  try {
    await requireJWT(req.headers.get('authorization') ?? '');
    const body = await req.json().catch(() => ({}));
    return new Response(JSON.stringify({ ok: true, received: body }), { headers: { 'content-type': 'application/json', ...cors } });
  } catch (e: any) {
    return new Response(JSON.stringify({ msg: e?.message ?? String(e) }), { status: 400, headers: { 'content-type': 'application/json', ...cors } });
  }
});
