import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing env vars'); process.exit(1)
}

const supabase = createClient(url, key)
const { data, error } = await supabase.from('students').select('id').limit(1)
if (error) { console.error('❌', error.message); process.exit(1) }
console.log('✅', data)
