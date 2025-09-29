// file: src/app/api/admin-check/route.ts
export async function GET(req: Request) {
  const header = req.headers.get('authorization') ?? ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : header
  if ((process.env.ADMIN_BEARER_TOKEN ?? '').trim() !== token.trim()) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return Response.json({ ok: true })
}
