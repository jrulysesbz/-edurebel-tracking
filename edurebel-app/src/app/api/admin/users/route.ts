// file: src/app/api/admin/users/route.ts
import { requireAdmin } from "../../../../lib/admin-auth"

export async function GET(req: Request) {
  const gate = requireAdmin(req)
  if (!gate.ok) return Response.json({ ok:false, error:gate.error }, { status: gate.status })
  return Response.json({ ok:true })
}
