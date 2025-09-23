import { supabase } from './supabase';

export async function riskScan(limit = 10) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not signed in');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/risk-scan?limit=${limit}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`risk-scan ${res.status}: ${body}`);
  }
  return res.json() as Promise<{ items: any[] }>;
}

export async function weeklyReports(classId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not signed in');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-reports`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ class_id: classId })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`weekly-reports ${res.status}: ${body}`);
  }
  return res.json() as Promise<{ ok: boolean; received: unknown }>;
}

export async function notifyGuardian(input: {
  student_id: string;
  topic: string;
  message: string;
  channels: string[];
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Not signed in');

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-guardian`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`notify-guardian ${res.status}: ${body}`);
  }
  return res.json() as Promise<{ ok: boolean; comm_id: string; created_at: string }>;
}
