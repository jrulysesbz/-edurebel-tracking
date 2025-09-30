import { createClient } from '@supabase/supabase-js';

export function createSupabaseForRequest(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const service = process.env.SUPABASE_SERVICE_ROLE!;
  const adminToken = process.env.ADMIN_BEARER_TOKEN;

  const raw = req.headers.get('authorization') || '';
  const m = raw.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1];

  // If caller used the app-level admin token, use service role for Supabase.
  if (token && adminToken && token === adminToken) {
    return createClient(url, service, {
      global: { headers: { 'X-Client-Role': 'admin' } },
    });
  }

  // Otherwise, treat it as a user JWT (or anonymous if none).
  return createClient(url, anon, token ? {
    global: { headers: { Authorization: `Bearer ${token}` } },
  } : undefined);
}
