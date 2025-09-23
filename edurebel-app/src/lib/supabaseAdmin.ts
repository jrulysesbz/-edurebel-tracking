import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SERVICE_ROLE as string

if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE')

export const supabaseAdmin = createClient(url, serviceKey)
