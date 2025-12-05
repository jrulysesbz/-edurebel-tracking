// file: src/lib/admin-auth.ts
export function requireAdmin(req: Request) {
  const header = req.headers.get('authorization') ?? ''
  const token  = header.startsWith('Bearer ') ? header.slice(7) : header
  const expected = (process.env.ADMIN_BEARER_TOKEN ?? '').trim()

  if (!expected) return { ok:false as const, status:500, error:'ADMIN_BEARER_TOKEN not set' }
  if (token.trim() !== expected) return { ok:false as const, status:401, error:'Unauthorized' }
  return { ok:true as const }
}
