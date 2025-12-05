export const env = (() => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const SERVICE =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE || '';

  if (!SUPABASE_URL || !ANON) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (!SERVICE) {
    console.warn('⚠️ SUPABASE service key not found on server; API proxies may fail.');
  }

  const refMatch = SUPABASE_URL.match(/^https:\/\/([^.]+)\.supabase\.co/);
  const PROJECT_REF = refMatch?.[1] ?? '';
  const FUNCTIONS_BASE = `https://${PROJECT_REF}.functions.supabase.co`;
  return { SUPABASE_URL, ANON, SERVICE, PROJECT_REF, FUNCTIONS_BASE };
})();
