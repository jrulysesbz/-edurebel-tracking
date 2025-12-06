// =========================================================
// src/app/classes/[id]/report/page.tsx
// Class behavior report (server component, no client handlers)
// =========================================================

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';
import PrintButton from '@/components/PrintButton';

type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

type ClassReportLog = BehaviorLogRow & {
  student_name: string | null;
  student_code: string | null;
  class_name: string | null;
  class_room: string | null;
};

const RANGE_OPTIONS = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: '12m', label: 'Last 12 months' },
] as const;

type RangeKey = (typeof RANGE_OPTIONS)[number]['key'];

function getRangeInfo(
  raw?: string | string[]
): { key: RangeKey; fromIso: string | null; label: string } {
  let range: string | undefined;

  if (Array.isArray(raw)) {
    range = raw[0];
  } else {
    range = raw;
  }

  const now = new Date();
  let from = new Date(now);
  let key: RangeKey = '30d';
  let label = 'Last 30 days';

  switch (range) {
    case '7d':
      key = '7d';
      label = 'Last 7 days';
      from.setDate(now.getDate() - 7);
      break;
    case '90d':
      key = '90d';
      label = 'Last 90 days';
      from.setDate(now.getDate() - 90);
      break;
    case '12m':
      key = '12m';
      label = 'Last 12 months';
      from.setFullYear(now.getFullYear() - 1);
      break;
    case '30d':
    default:
      key = '30d';
      label = 'Last 30 days';
      from.setDate(now.getDate() - 30);
      break;
  }

  const fromIso = from.toISOString();
  return { key, fromIso, label };
}

async function getClassReportData(
  classId: string,
  fromIso: string | null
): Promise<{ classRow: ClassRow | null; logs: ClassReportLog[] }> {
  const supabaseAny = supabase as any;

  const [{ data: classData, error: classError }, logsRes] = await Promise.all([
    supabaseAny
      .from('classes')
      .select('id, name, room')
      .eq('id', classId)
      .limit(1),
    (async () => {
      let query = supabaseAny
        .from('behavior_logs')
        .select(
          `
            id,
            created_at,
            student_id,
            class_id,
            category,
            severity,
            summary,
            room
          `
        )
        .eq('class_id', classId)
        .order('created_at', { ascending: true });

      if (fromIso) {
        query = query.gte('created_at', fromIso);
      }

      const { data, error } = await query;
      return { data, error };
    })(),
  ]);

  if (classError) {
    console.error('Error loading class for report', classError);
  }

  const classRow = (classData?.[0] as ClassRow | undefined) ?? null;

  if (!classRow) {
    return { classRow: null, logs: [] };
  }

  if (logsRes.error) {
    console.error('Error loading class behavior logs', logsRes.error);
    return { classRow, logs: [] };
  }

  const logs = (logsRes.data ?? []) as BehaviorLogRow[];

  // Collect student IDs for name/code lookup
  const studentIds = Array.from(
    new Set(
      logs
        .map((log) => log.student_id)
        .filter((id): id is string => !!id)
    )
  );

  let studentsById = new Map<
    string,
    { first_name: string | null; last_name: string | null; code: string | null }
  >();

  if (studentIds.length > 0) {
    const { data: studentsData, error: studentsError } = (await supabaseAny
      .from('students')
      .select('id, first_name, last_name, code')
      .in('id', studentIds)) as {
      data: StudentRow[] | null;
      error: Error | null;
    };

    if (studentsError) {
      console.error('Error loading students for class report', studentsError);
    }

    if (studentsData) {
      studentsById = new Map(
        studentsData.map((s) => [
          s.id,
          {
            first_name: s.first_name ?? null,
            last_name: s.last_name ?? null,
            code: s.code ?? null,
          },
        ])
      );
    }
  }

  const enriched: ClassReportLog[] = logs.map((log) => {
    const student = log.student_id ? studentsById.get(log.student_id) : undefined;

    const studentName = student
      ? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || null
      : null;

    const studentCode = student?.code ?? null;

    return {
      ...log,
      student_name: studentName,
      student_code: studentCode,
      class_name: classRow.name ?? null,
      class_room: classRow.room ?? null,
    };
  });

  return { classRow, logs: enriched };
}

type PageProps = {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?:
    | { range?: string | string[] }
    | Promise<{ range?: string | string[] } | undefined>;
};

export default async function ClassReportPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const id = resolvedParams.id;

  const rangeParam = resolvedSearchParams?.range;
  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(rangeParam);
  const exportUrl = `/api/class-report-export?class_id=${encodeURIComponent(
    id
  )}&range=${encodeURIComponent(rangeKey)}`;

  const { classRow, logs } = await getClassReportData(id, fromIso);

  if (!classRow) {
    notFound();
  }

  const totalLogs = logs.length;
  const highCount = logs.filter((l) => l.severity === 'high').length;
  const mediumCount = logs.filter((l) => l.severity === 'medium').length;
  const lowCount = logs.filter((l) => l.severity === 'low').length;

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Class behavior report
          </h1>
          <p className="text-sm text-slate-600">
            Timeline of logs, categories, and risk for this class. Use the range
            filter to control the window, then print or export for team meetings,
            SSTs, and parent conferences.
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
        </div>
      </header>

      <section className="space-y-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm print:border-0 print:shadow-none">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {classRow.name}{' '}
                {classRow.room ? (
                  <span className="text-sm font-normal text-slate-500">
                    • Room {classRow.room}
                  </span>
                ) : null}
              </h2>
              <p className="text-xs text-slate-500 print:text-slate-700">
                Showing logs for {rangeLabel}. Total logs:{' '}
                <span className="font-semibold">{totalLogs}</span>
              </p>
            </div>

            <div className="no-print flex flex-col items-end gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500">Range:</span>
                {RANGE_OPTIONS.map((opt) => {
                  const isActive = opt.key === rangeKey;
                  const href = `?range=${encodeURIComponent(opt.key)}`;
                  return (
                    <Link
                      key={opt.key}
                      href={href}
                      className={[
                        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {opt.label}
                    </Link>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
                  High: {highCount}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                  Medium: {mediumCount}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  Low: {lowCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Behavior log timeline
        </h2>

        {logs.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            No behavior logs found for this class in the selected range.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm print:border print:shadow-none">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700">
                    Date / Time
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700">
                    Severity
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700">
                    Student
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const date = new Date(log.created_at);
                  const dateStr = date.toLocaleDateString();
                  const timeStr = date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  let sevClass =
                    'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold';
                  if (log.severity === 'high') {
                    sevClass +=
                      ' bg-red-50 text-red-700 ring-1 ring-red-100';
                  } else if (log.severity === 'medium') {
                    sevClass +=
                      ' bg-amber-50 text-amber-700 ring-1 ring-amber-100';
                  } else {
                    sevClass +=
                      ' bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100';
                  }

                  return (
                    <tr key={log.id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        <div>{dateStr}</div>
                        <div className="text-[11px] text-slate-400">
                          {timeStr}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className={sevClass}>
                          {log.severity ?? 'low'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                        {log.student_name ? (
                          <>
                            <div>{log.student_name}</div>
                            {log.student_code ? (
                              <div className="text-[11px] text-slate-400">
                                {log.student_code}
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-slate-400">
                            (Unassigned)
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {log.category ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {log.summary ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

