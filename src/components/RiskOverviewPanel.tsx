'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Summary = {
  totalLogs?: number;
  studentsWithIncidents?: number;
  classesWithIncidents?: number;
  highSeverity?: number;
};

export default function RiskOverviewPanel() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/risk-scan?range=7d');

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: any = await res.json();
        // Be defensive about shape: try summary first, then root
        const raw = data?.summary ?? data ?? {};

        const nextSummary: Summary = {
          totalLogs:
            raw.total_logs ??
            raw.totalLogs ??
            raw.logs ??
            undefined,
          studentsWithIncidents:
            raw.students_with_incidents ??
            raw.studentsWithIncidents ??
            undefined,
          classesWithIncidents:
            raw.classes_with_incidents ??
            raw.classesWithIncidents ??
            undefined,
          highSeverity:
            raw.high_severity_logs ??
            raw.highSeverityLogs ??
            raw.highSeverity ??
            undefined,
        };

        if (!cancelled) {
          setSummary(nextSummary);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading risk summary for overview', err);
        if (!cancelled) {
          setError('Failed to load risk data');
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      key: 'totalLogs',
      label: 'Logs (last 7 days)',
      value: summary?.totalLogs,
    },
    {
      key: 'studentsWithIncidents',
      label: 'Students with incidents',
      value: summary?.studentsWithIncidents,
    },
    {
      key: 'classesWithIncidents',
      label: 'Classes with incidents',
      value: summary?.classesWithIncidents,
    },
    {
      key: 'highSeverity',
      label: 'High-severity logs',
      value: summary?.highSeverity,
    },
  ] as const;

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Risk snapshot
          </h2>
          <p className="text-xs text-slate-500">
            Last 7 days · based on behavior logs
          </p>
        </div>
        <Link
          href="/risk"
          className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
        >
          View full dashboard
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">Loading risk data…</p>
      ) : error ? (
        <p className="text-xs text-red-600">
          Couldn&apos;t load risk data. Open the full{' '}
          <Link
            href="/risk"
            className="underline underline-offset-4 hover:text-red-700"
          >
            Risk dashboard
          </Link>{' '}
          for details.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.key}
              className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {typeof card.value === 'number' ? card.value : '—'}
              </p>
              {card.key === 'highSeverity' &&
                typeof card.value === 'number' &&
                card.value > 0 && (
                  <p className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                    Attention needed
                  </p>
                )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

