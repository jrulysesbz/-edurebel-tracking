'use client';
import { supabase } from './supabaseClient';

export async function getAccessToken(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? undefined;
}
