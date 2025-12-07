// =========================================================
// src/app/classes/[id]/report/page.tsx
// Class behavior report (server component, no client handlers)
// =========================================================

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';
import PrintButton from '@/components/PrintButton';

type Db = Database['public'];

type BehaviorLogWithRefs = Db['Tables']['behavior_logs']['Row'] & {
  students: Pick<Db['Tables']['students']['Row'], 'id' | 'first_name' | 'last_name' | 'code'> | null;
  classes: Pick<Db['Tables']['classes']['Row'], 'id' | 'name' | 'room'> | null;
};

type RangeKey = '7d' | '30d' | '90d' | '12m';

type RangeInfo = {
  key: RangeKey;
  fromIso: string | null;
  label: string;
};

type PageSearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  params: { id: string };
  searchParams: Promise<PageSearchParams>;
};

function getRangeInfo(raw: string | undefined): RangeInfo {
  const now = new Date();
  let key: RangeKey = '30d';

  if (raw === '7d' || raw === '30d' || raw === '90d' || raw === '12m') {
    key = raw;
  }

  let fromIso: string | null = null;
  let label = '';

  if (key === '7d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    fromIso = from.toISOString();
    label = 'Last 7 days';
  } else if (key === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    fromIso = from.toISOString();
    label = 'Last 30 days';
  } else if (key === '90d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 90);
    fromIso = from.toISOString();
    label = 'Last 90 days';
  } else if (key === '12m') {
    const from = new Date(now);
    from.setMonth(from.getMonth() - 12);
    fromIso = from.toISOString();
    label = 'Last 12 months';
  }

  return { key, fromIso, label };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function severityBadgeClass(severity: string | null): string {
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold';
  if (severity === 'high') {
    return `${base} bg-rose-100 text-rose-700`;
  }
  if (severity === 'medium') {
    return `${base} bg-amber-100 text-amber-700`;
  }
  if (severity === 'low') {
    return `${base} bg-emerald-100 text-emerald-700`;
  }
  return `${base} bg-slate-100 text-slate-600`;
}

export default async function ClassReportPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const resolvedSearch = await searchParams;

  const rangeParamRaw = resolvedSearch?.range;
  const rangeParam = firstParam(rangeParamRaw);

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(rangeParam);
  const exportUrl = `/api/class-report-export?class_id=${encodeURIComponent(
    id,
  )}&range=${encodeURIComponent(rangeKey)}`;

  const supabaseAny = supabase as any;

  const [
    { data: classRow, error: classError },
    { data: logsData, error: logsError },
  ] = await Promise.all([
    supabaseAny
      .from('classes')
      .select('id, name, room')
      .eq('id', id)
      .maybeSingle(),
    supabaseAny
      .from('behavior_logs')
      .select(
        `
        id,
        created_at,
        student_id,
        class_id,
        room,
        category,
        severity,
        summary,
        students:student_id (
          id,
          first_name,
          last_name,
          code
        ),
        classes:class_id (
          id,
          name,
          room
        )
      `,
      )
      .eq('class_id', id)
      .order('created_at', { ascending: false })
      .gte('created_at', fromIso ?? '1970-01-01T00:00:00Z'),
  ]);

  if (classError) {
    console.error('Error loading class for report', classError);
    throw classError;
  }

  if (!classRow) {
    notFound();
  }

  if (logsError) {
    console.error('Error loading class logs for report', logsError);
  }

  const logs: BehaviorLogWithRefs[] = (logsData ?? []) as BehaviorLogWithRefs[];

  const totalLogs = logs.length;
  const highCount = logs.filter((l) => l.severity === 'high').length;
  const mediumCount = logs.filter((l) => l.severity === 'medium').length;
  const lowCount = logs.filter((l) => l.severity === 'low').length;
  const studentCount = new Set(
    logs.map((l) => l.student_id).filter((v): v is string => Boolean(v)),
  ).size;

  const classLabel = `${classRow.name}${classRow.room ? ` · ${classRow.room}` : ''}`;

  return (
    <main className="space-y-4">
      {/* Header with range, Print, CSV, and View in logs */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Class behavior report
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Range: {rangeLabel}
          </p>
          <p className="text-sm text-slate-600">
            Timeline of logs, categories, and risk for this class. Use the range
            filter to control the window, then print or export for team meetings,
            SSTs, and parent conferences.
          </p>
          <p className="text-xs text-slate-500">
            Class:{' '}
            <span className="font-semibold text-slate-800">{classLabel}</span>
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <PrintButton label="Print class report" />
          <a
            href={exportUrl}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Export CSV
          </a>
          <Link
            href={{
              pathname: '/logs',
              query: {
                range: rangeKey,
                class_id: id,
              },
            }}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            View in logs
          </Link>
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Total logs
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{totalLogs}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            High
          </p>
          <p className="mt-1 text-xl font-semibold text-rose-700">{highCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Medium
          </p>
          <p className="mt-1 text-xl font-semibold text-amber-700">{mediumCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Low
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">{lowCount}</p>
        </div>
      </section>

      {/* Legend / help */}
      <section className="no-print rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <p className="font-semibold text-slate-700">How to use this report</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>
            <span className="font-semibold">Range</span> controls the time window.
            All counts and exports respect this.
          </li>
          <li>
            <span className="font-semibold">Severity</span> gives you a quick view
            of how serious the pattern is overall.
          </li>
          <li>
            Use <span className="font-semibold">Print</span> for PDF handouts and{' '}
            <span className="font-semibold">Export CSV</span> for deeper analysis or
            sharing with teams.
          </li>
        </ul>
      </section>

      {/* Logs table */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
          Logs ({totalLogs}) · Students involved: {studentCount}
        </div>
        <div className="max-h-[540px] overflow-auto text-xs">
          <table className="min-w-full border-separate border-spacing-y-1">
            <thead className="sticky top-0 bg-white">
              <tr className="text-[11px] text-slate-500">
                <th className="px-3 py-1 text-left">Date / Time</th>
                <th className="px-3 py-1 text-left">Student</th>
                <th className="px-3 py-1 text-left">Room</th>
                <th className="px-3 py-1 text-left">Severity</th>
                <th className="px-3 py-1 text-left">Category</th>
                <th className="px-3 py-1 text-left">Summary</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const student = log.students;
                const studentLabel = student
                  ? `${student.last_name ?? ''}${student.first_name ?? ''}${
                      student.code ? ` (${student.code})` : ''
                    }`.trim() || 'Unknown student'
                  : 'Unknown student';

                const roomLabel =
                  log.classes?.room ?? log.room ?? '—';

                return (
                  <tr key={log.id} className="bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-1 align-top text-[11px] text-slate-600">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : 'Unknown date'}
                    </td>
                    <td className="px-3 py-1 align-top text-[11px] text-slate-800">
                      {studentLabel}
                    </td>
                    <td className="px-3 py-1 align-top text-[11px] text-slate-600">
                      {roomLabel}
                    </td>
                    <td className="px-3 py-1 align-top">
                      <span className={severityBadgeClass(log.severity)}>
                        {log.severity ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-1 align-top text-[11px] capitalize">
                      {log.category ?? '—'}
                    </td>
                    <td className="px-3 py-1 align-top text-[11px] text-slate-700">
                      {log.summary ?? '—'}
                    </td>
                  </tr>
                );
              })}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-xs text-slate-500"
                  >
                    No logs for this class in this range yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

