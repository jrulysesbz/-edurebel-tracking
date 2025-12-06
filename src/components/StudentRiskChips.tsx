'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Props = {
  studentId: string;
};

type RiskLevel = 'none' | 'low' | 'medium' | 'high';

type RiskSummary = {
  risk_level: RiskLevel;
  total_logs: number;
  recent_7d: number;
  recent_30d: number;
};

export default function StudentRiskChips({ studentId }: Props) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          range: '30d',
          student_id: studentId,
        });

        const res = await fetch(`/api/risk-scan?${params.toString()}`);

        if (!res.ok) {
          throw new Error(`Failed to load risk summary (${res.status})`);
        }

        const json = await res.json();

        // Try to be defensive about the shape coming back from /api/risk-scan
        const s: RiskSummary | null =
          json?.summary
            ? {
                risk_level: json.summary.risk_level ?? 'none',
                total_logs: json.summary.total_logs ?? 0,
                recent_7d: json.summary.recent_7d ?? 0,
                recent_30d: json.summary.recent_30d ?? 0,
              }
            : null;

        if (!cancelled) {
          setSummary(s);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error loading student risk summary', err);
          setError('Error');
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (studentId) {
      load();
    } else {
      setLoading(false);
      setSummary(null);
    }

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (!studentId) {
    return null;
  }

  // While loading, show a subtle placeholder so we don’t jump the layout
  if (loading && !summary && !error) {
    return (
      <div className="mt-2 text-xs text-slate-400">
        Loading risk…
      </div>
    );
  }

  // If the API failed, don’t blow up the page; just show a tiny “N/A”
  if (error || !summary) {
    return (
      <div className="mt-2 text-xs text-slate-400">
        Risk: N/A
      </div>
    );
  }

  const { risk_level, total_logs, recent_7d, recent_30d } = summary;

  const levelLabel =
    risk_level === 'high'
      ? 'High risk'
      : risk_level === 'medium'
      ? 'Medium risk'
      : risk_level === 'low'
      ? 'Low risk'
      : 'No recent risk';

  const levelClass =
    risk_level === 'high'
      ? 'bg-red-100 text-red-800 border-red-200'
      : risk_level === 'medium'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : risk_level === 'low'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  const href = `/risk?student_id=${encodeURIComponent(
    studentId
  )}&range=30d`;

  return (
    <Link
      href={href}
      className="mt-2 inline-flex flex-wrap gap-1 text-xs text-slate-600 hover:opacity-80"
      prefetch
    >
      {/* Overall risk chip */}
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${levelClass}`}
      >
        {levelLabel}
      </span>

      {/* Totals chip */}
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
        Total logs: {total_logs}
      </span>

      {/* Recent window chips */}
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
        Last 7 days: {recent_7d}
      </span>

      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
        Last 30 days: {recent_30d}
      </span>

      {/* Hint */}
      <span className="inline-flex items-center rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[10px] text-slate-400">
        Click for full risk dashboard →
      </span>
    </Link>
  );
}

