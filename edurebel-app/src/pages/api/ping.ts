import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // simple call that uses the client (no DB access needed)
  const urlOk = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const keyOk = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  res.status(200).json({ ok: true, urlOk, keyOk, message: 'Auth is healthy' })
}
