// src/lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE || ''; // anon preferred

/**
 * Server-side client bound to a Request. Critically:
 * - Forwards Authorization (user/admin bearer) to honor RLS.
 * - Includes cookies so PostgREST can read gotrue session if present.
 */
export function createSupabaseForRequest(req: Request) {
  const auth = req.headers.get('Authorization') || '';
  const cookies = req.headers.get('Cookie') || '';

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        ...(cookies ? { Cookie: cookies } : {}),
      },
    },
  });
}
