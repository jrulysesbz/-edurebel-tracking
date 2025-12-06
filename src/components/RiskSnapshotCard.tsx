'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type RiskSummary = {
  high?: number;
  medium?: number;
  low?: number;
  none?: number;
  totalLogs?: number;
};

export default function RiskSnapshotCard() {
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/risk-scan?range=30d');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json: any = await res.json();
        const s: any = json?.summary ?? json ?? {};

        setSummary({
          high: s.high ?? s.high_risk ?? 0,
          medium: s.medium ?? s.medium_risk ?? 0,
          low: s.low ?? s.low_risk ?? 0,
          none: s.none ?? s.no_risk ?? 0,
          totalLogs:
            s.totalLogs ?? s.total_logs ?? s.total ?? s.total_logs_30d ?? 0,
        });
      } catch (err) {
        console.error('Failed to load risk snapshot', err);
        setError('Unable to load risk snapshot');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Risk snapshot
          </p>
          <p className="text-xs text-slate-500">Last 30 days</p>
        </div>
        <Link
          href="/risk?range=30d"
          className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-800"
        >
          Open Risk dashboard
        </Link>
      </div>

      {loading && (
        <p className="text-xs text-slate-500">Loading risk data…</p>
      )}

      {error && !loading && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {!loading && !error && summary && (
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-md bg-red-50 px-3 py-2">
            <p className="font-semibold text-red-700">High risk</p>
            <p className="text-lg font-bold text-red-800">
              {summary.high ?? 0}
            </p>
          </div>
          <div className="rounded-md bg-amber-50 px-3 py-2">
            <p className="font-semibold text-amber-700">Medium</p>
            <p className="text-lg font-bold text-amber-800">
              {summary.medium ?? 0}
            </p>
          </div>
          <div className="rounded-md bg-sky-50 px-3 py-2">
            <p className="font-semibold text-sky-700">Low</p>
            <p className="text-lg font-bold text-sky-800">
              {summary.low ?? 0}
            </p>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-700">No risk</p>
            <p className="text-lg font-bold text-slate-800">
              {summary.none ?? 0}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <p className="mt-3 text-[11px] text-slate-500">
          Total logs (30d):{' '}
          <span className="font-semibold">
            {summary?.totalLogs ?? 0}
          </span>
        </p>
      )}
    </div>
  );
}

