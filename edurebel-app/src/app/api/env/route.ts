export const runtime = 'nodejs';
export async function GET() {
  const url   = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const srv   = process.env.SUPABASE_SERVICE_ROLE ?? '';
  return new Response(
    JSON.stringify({
      NEXT_PUBLIC_SUPABASE_URL_len: url.length,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_prefix: anon.slice(0,12),
      SUPABASE_SERVICE_ROLE_prefix: srv.slice(0,12),
      has_SERVICE: Boolean(process.env.SUPABASE_SERVICE_ROLE),
    }),
    { headers: { 'content-type': 'application/json' } }
  );
}
