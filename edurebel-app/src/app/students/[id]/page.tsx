'use client';
import { getAccessToken } from '../../../lib/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';


async function authedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const t = await getAccessToken();
  const headers = { ...(init?.headers || {}) } as Record<string, string>;
  if (t) headers.Authorization = `Bearer ${t}`;
  return fetch(input, { ...(init || {}), headers });
}

type ReportResp = { ok: boolean; url?: string; error?: string; path?: string };
type StudentNameRow = { first_name: string | null; last_name: string | null };

import QuickLog from "../../../components/QuickLog";

export default function StudentPage() {
  const raw = useParams() as Record<string, string | string[]> | null;
  const studentId = raw && typeof raw.id !== 'undefined'
    ? (Array.isArray(raw.id) ? raw.id[0] : raw.id)
    : '';

  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return; // wait until param exists
    let ok = true;
    setLoading(true);
    fetch(`/api/students?id=eq.${studentId}&select=first_name,last_name`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.statusText))))
      .then((rows: StudentNameRow[]) => {
        if (!ok) return;
        const row = Array.isArray(rows) ? rows[0] : undefined;
        const nm = row ? `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() : '';
        setName(nm || studentId);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
        setName(studentId);
      })
      .finally(() => ok && setLoading(false));
    return () => { ok = false; };
  }, [studentId]);

  const getReport = useCallback(async () => {
    if (!studentId) return;
    try {
      setSigning(true);
      setErr(null);
      const res = await authedFetch('/api/get-report-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data: ReportResp = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || 'Failed to get report');
      }
      setSignedUrl(data.url);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setSigning(false);
    }
  }, [studentId]);

  const title = studentId ? (loading ? 'Loading…' : name) : 'Loading…';

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between border rounded-xl p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {err ? <p className="text-xs mt-1 text-red-600">{err}</p> : null}
          {signedUrl ? <p className="text-xs mt-1 text-gray-500 break-all">Last signed URL: {signedUrl}</p> : null}
        </div>
        <button
          onClick={getReport}
          disabled={signing || !studentId}
          className="px-3 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
        >
          {signing ? 'Signing…' : 'Get Weekly Report'}
        </button>
      </div>

      <section>
        <QuickLog studentId={studentId} />
      </section>
    </main>
  );
}
