// =========================================================
// src/app/classes/[id]/report/page.tsx
// Class behavior report (server component, no client handlers)
// =========================================================

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

export const dynamic = 'force-dynamic';

type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

type PageParams = {
  id: string;
};

type PageSearchParams = {
  range?: string;
};

// ---------- helpers ----------

function getSinceIso(range: string | undefined): string | null {
  const value = range || '30d';

  if (value === 'all') return null;

  const now = new Date();

  if (value === '7d') {
    now.setDate(now.getDate() - 7);
  } else if (value === '30d') {
    now.setDate(now.getDate() - 30);
  } else {
    // default fallback
    now.setDate(now.getDate() - 30);
  }

  return now.toISOString();
}

async function getClassById(classId: string): Promise<ClassRow | null> {
  const supabaseAny = supabase as any;

  try {
    const { data, error } = await supabaseAny
      .from('classes')
      .select('id, name, room')
      .eq('id', classId)
      .single();

    if (error) {
      console.error('Error loading class for report', error);
      return null;
    }

    return data as ClassRow;
  } catch (err) {
    console.error('Unexpected error loading class for report', err);
    return null;
  }
}

async function getStudentsForClass(classId: string): Promise<StudentRow[]> {
  const supabaseAny = supabase as any;

  try {
    const { data, error } = await supabaseAny
      .from('students')
      .select('id, first_name, last_name, code, class_id, is_live')
      .eq('class_id', classId)
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error loading students for report', error);
      return [];
    }

    return (data ?? []) as StudentRow[];
  } catch (err) {
    console.error('Unexpected error loading students for report', err);
    return [];
  }
}

async function getLogsForClass(
  classId: string,
  sinceIso: string | null
): Promise<BehaviorLogRow[]> {
  const supabaseAny = supabase as any;

  try {
    let query = supabaseAny
      .from('behavior_logs')
      .select('id, summary, level, occurred_at, student_id, class_id')
      .eq('class_id', classId)
      .order('occurred_at', { ascending: false });

    if (sinceIso) {
      query = query.gte('occurred_at', sinceIso);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading logs for report', error);
      return [];
    }

    return (data ?? []) as BehaviorLogRow[];
  } catch (err) {
    console.error('Unexpected error loading logs for report', err);
    return [];
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------- page component ----------

export default async function ClassReportPage(props: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const [resolvedParams, resolvedSearch] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const classId = resolvedParams.id;
  const range = resolvedSearch.range ?? '30d';
  const sinceIso = getSinceIso(range);

  const [cls, students, logs] = await Promise.all([
    getClassById(classId),
    getStudentsForClass(classId),
    getLogsForClass(classId, sinceIso),
  ]);

  if (!cls) {
    notFound();
  }

  // Build maps & summaries
  const studentsById = new Map<string, StudentRow>();
  students.forEach((s) => {
    studentsById.set(s.id, s);
  });

  const logsByStudent = new Map<string, BehaviorLogRow[]>();
  logs.forEach((log) => {
    const sid = log.student_id;
    if (!sid) return;
    const existing = logsByStudent.get(sid) ?? [];
    existing.push(log);
    logsByStudent.set(sid, existing);
  });

  const distinctStudentsWithLogs = Array.from(logsByStudent.keys()).length;

  const levelCounts = logs.reduce<Record<string, number>>((acc, log) => {
    const lvl = (log.level as string | null) ?? 'unspecified';
    acc[lvl] = (acc[lvl] ?? 0) + 1;
    return acc;
  }, {});

  const rangeLabel =
    range === '7d'
      ? 'Last 7 days'
      : range === '30d'
      ? 'Last 30 days'
      : 'All time';

  const rangeOptions: { value: string; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <main className="space-y-6 bg-slate-50 p-4 print:bg-white print:p-0">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500 print:hidden">
        <Link href="/classes" className="hover:underline">
          ← Back to classes
        </Link>
      </div>

      {/* Header */}
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Class behavior report
          </h1>
          <p className="text-sm text-slate-600">
            {cls?.name ?? 'Unnamed class'}
            {cls?.room ? ` • Room ${cls.room}` : null}
          </p>
          <p className="text-xs text-slate-500">
            Range: <span className="font-medium">{rangeLabel}</span>
          </p>
          <p className="text-[11px] text-slate-400 print:hidden">
            Tip: Use your browser&apos;s print function (Cmd/Ctrl + P) to save
            or print this report.
          </p>
        </div>

        {/* Range filters (no onClick, pure links) */}
        <div className="flex flex-wrap gap-2 print:hidden">
          {rangeOptions.map((opt) => {
            const isActive = opt.value === range;
            const href =
              opt.value === '30d'
                ? `/classes/${classId}/report`
                : `/classes/${classId}/report?range=${opt.value}`;

            return (
              <Link
                key={opt.value}
                href={href}
                className={[
                  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition',
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
                ].join(' ')}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* KPI summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total logs
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {logs.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Behavior entries in the selected range.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Students with logs
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {distinctStudentsWithLogs}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Out of {students.length || '0'} students in this class.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Levels summary
          </p>
          {Object.keys(levelCounts).length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No levels recorded.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              {Object.entries(levelCounts).map(([lvl, count]) => (
                <li key={lvl} className="flex justify-between gap-2">
                  <span className="capitalize">{lvl}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Per-student breakdown */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Student overview
        </h2>

        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No behavior logs in this range for this class.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Code
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total logs
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last entry
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const sLogs = logsByStudent.get(student.id) ?? [];
                  if (sLogs.length === 0) return null;

                  const latest = sLogs[0];

                  const fullName = [student.first_name, student.last_name]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 align-middle text-slate-900">
                        {fullName || 'Unnamed student'}
                      </td>
                      <td className="px-3 py-2 align-middle text-slate-700">
                        {student.code ?? '—'}
                      </td>
                      <td className="px-3 py-2 align-middle text-center text-slate-900">
                        {sLogs.length}
                      </td>
                      <td className="px-3 py-2 align-middle text-slate-700">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium text-slate-800">
                            {latest.summary ?? 'No summary'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatDateTime(latest.occurred_at as string)}
                            {latest.level
                              ? ` • Level ${(latest.level as string) || ''}`
                              : ''}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Full log list */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm break-inside-avoid-page">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Full log list
        </h2>

        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No entries to show in this range.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {logs.map((log) => {
              const student = log.student_id
                ? studentsById.get(log.student_id)
                : null;
              const fullName = student
                ? [student.first_name, student.last_name]
                    .filter(Boolean)
                    .join(' ')
                : '';

              return (
                <li
                  key={log.id}
                  className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-800">
                      {log.summary ?? 'No summary'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {formatDateTime(log.occurred_at as string)}
                      {fullName ? ` • ${fullName}` : ''}
                      {student?.code ? ` (${student.code})` : ''}
                    </p>
                  </div>
                  <div className="mt-0.5 flex items-center sm:mt-0">
                    <span className="inline-flex rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {((log.level as string) ?? 'unspecified') || 'unspecified'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

