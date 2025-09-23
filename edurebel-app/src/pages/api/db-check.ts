// src/pages/api/db-check.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase.from('students').select('id').limit(1)
  if (error) return res.status(200).json({ ok: false, error: error.message })
  return res.status(200).json({ ok: true, rows: data?.length ?? 0, sample: data?.[0] ?? null })
}
