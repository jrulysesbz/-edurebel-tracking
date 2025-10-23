'use client';

import { useState } from 'react';

type Props = { studentId: string };

export default function ReportButton({ studentId }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/get-report-url', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={busy}
        className="px-2 py-1 rounded bg-black text-white text-xs disabled:opacity-50"
      >
        {busy ? 'Signing…' : 'Download report'}
      </button>
      {err ? <span className="text-xs text-red-600">Error: {err}</span> : null}
    </div>
  );
}
