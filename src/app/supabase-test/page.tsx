// src/app/supabase-test/page.tsx
import { supabase } from '@/lib/supabaseClient';

export default async function SupabaseTestPage() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .limit(1);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Supabase Test</h1>
      {error && (
        <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>
          Error: {error.message}
        </pre>
      )}
      {!error && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          Connected ✅{'\n'}
          First row from "students":{'\n'}
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}

