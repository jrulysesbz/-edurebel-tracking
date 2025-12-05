import { supabase } from './lib/supabaseClient'

async function main() {
  const { data, error } = await supabase.from('students').select('id').limit(1)
  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
  console.log('✅ Success:', data)
}
main()
