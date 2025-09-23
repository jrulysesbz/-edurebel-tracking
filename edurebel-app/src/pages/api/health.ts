// src/pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const urlOk = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const keyOk = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  res.status(200).json({ ok: urlOk && keyOk, urlOk, keyOk })
}
