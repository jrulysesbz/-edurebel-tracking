'use client';
import React, { useEffect, useState } from 'react';

type RiskRow = {
  student_id: string;
  student_name: string | null;
  class_id: string | null;
  class_name: string | null;
  school_id: string | null;
  recent_incidents: number | null;
  low_participation: number | null;
  recent_stars: number | null;
};

export default function RiskPanel({ limit = 5 }: { limit?: number }) {
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    setLoading(true);
    fetch(`/api/risk-scan?limit=${limit}`)
      .then(r => r.json())
      .then(j => {
        if (!ok) return;
        if (j.ok === false && j.error) { setErr(String(j.error)); setRows([]); }
        else setRows(j.data ?? []);
      })
      .catch(e => setErr(String(e)))
      .finally(() => ok && setLoading(false));
    return () => { ok = false; };
  }, [limit]);

  if (loading) return <div className="text-sm opacity-70">Loading risk…</div>;
  if (err) return <div className="text-sm text-red-600">Error: {err}</div>;
  if (!rows.length) return <div className="text-sm opacity-70">No risk signals.</div>;

  return (
    <div className="border rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold mb-3">Risk signals (top {limit})</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-2">Student</th>
              <th className="py-2 pr-2">Class</th>
              <th className="py-2 pr-2">Incidents</th>
              <th className="py-2 pr-2">No-Participation</th>
              <th className="py-2 pr-2">Stars (14d)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.student_id} className="border-b last:border-0">
                <td className="py-2 pr-2">{r.student_name || r.student_id}</td>
                <td className="py-2 pr-2">{r.class_name || '—'}</td>
                <td className="py-2 pr-2">{r.recent_incidents ?? 0}</td>
                <td className="py-2 pr-2">{r.low_participation ?? 0}</td>
                <td className="py-2 pr-2">{r.recent_stars ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
