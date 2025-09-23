import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jwtVerify } from 'https://deno.land/x/jose@v4.13.1/index.ts';

export const ENV = {
  url: Deno.env.get('FUNC_SUPABASE_URL')!,
  anon: Deno.env.get('FUNC_ANON_KEY')!,
  service: Deno.env.get('FUNC_SERVICE_ROLE_KEY')!,
  jwt: Deno.env.get('FUNC_JWT_SECRET')!,
};

export const cors = { 'access-control-allow-origin': '*' };

export async function requireJWT(h: string) {
  if (!h?.startsWith('Bearer ')) throw new Error('missing bearer token');
  const token = h.slice(7);
  await jwtVerify(token, new TextEncoder().encode(ENV.jwt));
  return h;
}

export function sbUser(auth: string) {
  return createClient(ENV.url, ENV.anon, { global: { headers: { Authorization: auth } } });
}

export function sbService() {
  return createClient(ENV.url, ENV.service);
}
