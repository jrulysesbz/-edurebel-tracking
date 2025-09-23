const ORIGIN = Deno.env.get('CORS_ORIGIN') ?? 'http://localhost:3000';
export const corsHeaders = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers': 'authorization,content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};
