import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';

type RangeKey = '7d' | '30d' | '90d' | '12m';

type SeverityFilter = 'high' | 'medium' | 'low' | null;
type CategoryFilter =
  | 'disruption'
  | 'work'
  | 'respect'
  | 'safety'
  | 'other'
  | null;

type SearchParams = Record<string, string | string[]>;

interface PageProps {
  searchParams?: Promise<SearchParams> | SearchParams;
}

type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

interface BehaviorLogWithRelations extends BehaviorLogRow {
  students: Pick<StudentRow, 'id' | 'first_name' | 'last_name' | 'code'> | null;
  classes: Pick<ClassRow, 'id' | 'name' | 'room'> | null;
}

interface RangeInfo {
  key: RangeKey;
  fromIso: string | null;
  label: string;
}

// --- Helpers --------------------------------------------------------

function getRangeInfo(raw?: string): RangeInfo {
  const now = new Date();

  let key: RangeKey = '30d';
  if (raw === '7d' || raw === '90d' || raw === '12m') {
    key = raw;
  }

  let from: Date | null = new Date(now);
  let label = '';

  switch (key) {
    case '7d': {
      from.setDate(now.getDate() - 7);
      label = 'Last 7 days';
      break;
    }
    case '30d': {
      from.setDate(now.getDate() - 30);
      label = 'Last 30 days';
      break;
    }
    case '90d': {
      from.setDate(now.getDate() - 90);
      label = 'Last 90 days';
      break;
    }
    case '12m': {
      from.setFullYear(now.getFullYear() - 1);
      label = 'Last 12 months';
      break;
    }
  }

  return {
    key,
    fromIso: from ? from.toISOString() : null,
    label,
  };
}

function normalizeSeverity(param: string | undefined): SeverityFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return null;
}

function normalizeCategory(param: string | undefined): CategoryFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (
    v === 'disruption' ||
    v === 'work' ||
    v === 'respect' ||
    v === 'safety' ||
    v === 'other'
  ) {
    return v;
  }
  return null;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function studentDisplayName(
  s: BehaviorLogWithRelations['students'],
): string {
  if (!s) return 'Unknown student';
  const parts = [s.first_name, s.last_name].filter(Boolean);
  const name =
    parts.length > 0 ? parts.join(' ') : s.code || 'Unknown student';
  if (s.code) {
    return `${name} (${s.code})`;
  }
  return name;
}

function classDisplayName(c: BehaviorLogWithRelations['classes']): string {
  if (!c) return 'Unknown class';
  return c.name || 'Unknown class';
}

// --- Data loader ----------------------------------------------------

async function getLogsForFilters(
  rangeKey: RangeKey,
  fromIso: string | null,
  severity: SeverityFilter,
  category: CategoryFilter,
  studentId: string | null,
  classId: string | null,
): Promise<{
  logs: BehaviorLogWithRelations[];
  totalLogs: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}> {
  const supabaseAny = supabase as any;

  let query = supabaseAny
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
    .order('created_at', { ascending: false });

  if (fromIso) {
    query = query.gte('created_at', fromIso);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading logs', error);
    throw error;
  }

  const logs = (data ?? []) as BehaviorLogWithRelations[];

  const highCount = logs.filter((l) => l.severity === 'high').length;
  const mediumCount = logs.filter((l) => l.severity === 'medium').length;
  const lowCount = logs.filter((l) => l.severity === 'low').length;

  return {
    logs,
    totalLogs: logs.length,
    highCount,
    mediumCount,
    lowCount,
  };
}

// --- Page component -------------------------------------------------

export default async function LogsPage({ searchParams }: PageProps) {
  const resolvedSearch = (await searchParams) ?? {};
  const sp = resolvedSearch as SearchParams;

  const rangeParamRaw = sp.range;
  const rangeParam = Array.isArray(rangeParamRaw)
    ? rangeParamRaw[0]
    : rangeParamRaw;

  const severityParamRaw = sp.severity;
  const severityParam = Array.isArray(severityParamRaw)
    ? severityParamRaw[0]
    : severityParamRaw;

  const categoryParamRaw = sp.category;
  const categoryParam = Array.isArray(categoryParamRaw)
    ? categoryParamRaw[0]
    : categoryParamRaw;

  const studentIdRaw = sp.student_id;
  const studentIdParam = Array.isArray(studentIdRaw)
    ? studentIdRaw[0]
    : studentIdRaw;

  const classIdRaw = sp.class_id;
  const classIdParam = Array.isArray(classIdRaw)
    ? classIdRaw[0]
    : classIdRaw;

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(
    rangeParam as string | undefined,
  );
  const severityFilter = normalizeSeverity(severityParam as string | undefined);
  const categoryFilter = normalizeCategory(categoryParam as string | undefined);
  const studentIdFilter = studentIdParam ?? null;
  const classIdFilter = classIdParam ?? null;

  let data;
  try {
    data = await getLogsForFilters(
      rangeKey,
      fromIso,
      severityFilter,
      categoryFilter,
      studentIdFilter,
      classIdFilter,
    );
  } catch (err) {
    return (
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Behavior logs
            </h1>
            <p className="text-sm text-slate-600">
              Central log view for student behavior entries.
            </p>
          </div>
        </header>
        <p className="rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          There was an error loading logs. Please refresh or adjust your
          filters.
        </p>
      </main>
    );
  }

  const { logs, totalLogs, highCount, mediumCount, lowCount } = data;

  // Display summary of active filters
  const hasStudentFilter = Boolean(studentIdFilter);
  const hasClassFilter = Boolean(classIdFilter);

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Behavior logs
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Range: {rangeLabel}
          </p>
          <p className="text-sm text-slate-600">
            Filter and review individual logs. Use this with the risk dashboard,
            student, and class reports for deeper patterns.
          </p>
          {(hasStudentFilter || hasClassFilter) && (
            <p className="text-xs text-slate-500">
              Active context:{' '}
              {hasStudentFilter && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  Student filter
                </span>
              )}{' '}
              {hasClassFilter && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  Class filter
                </span>
              )}
            </p>
          )}
        </div>

        <div className="no-print flex items-center gap-2">
          <Link
            href="/logs/new"
            className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            + New log
          </Link>
          <Link
            href="/risk"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            View risk dashboard
          </Link>
        </div>
      </header>

      {/* Legend / help text */}
      <section className="no-print rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <p className="font-semibold text-slate-700">How to use this view</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>
            <span className="font-semibold">Range</span> controls the time
            window (7d, 30d, 90d, 12m). All counts and lists respect this.
          </li>
          <li>
            <span className="font-semibold">Severity</span>:
            <span className="ml-1 font-medium text-emerald-700">Low</span> =
            minor reminders,{' '}
            <span className="font-medium text-amber-700">Medium</span> =
            repeated or disruptive,{' '}
            <span className="font-medium text-rose-700">High</span> = serious
            safety or pattern concerns.
          </li>
          <li>
            <span className="font-semibold">Category</span> focuses the view on
            disruption, work habits, respect, safety, or other notes.
          </li>
          <li>
            Student / class context comes from the profile and report pages via
            “View in logs”.
          </li>
        </ul>
      </section>

      {/* Filters toolbar */}
      <section className="no-print flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            Range
          </span>
          {[
            { key: '7d', label: 'Last 7 days' },
            { key: '30d', label: 'Last 30 days' },
            { key: '90d', label: 'Last 90 days' },
            { key: '12m', label: 'Last 12 months' },
          ].map((opt) => (
            <Link
              key={opt.key}
              href={{
                pathname: '/logs',
                query: {
                  range: opt.key,
                  ...(severityFilter ? { severity: severityFilter } : {}),
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(studentIdFilter ? { student_id: studentIdFilter } : {}),
                  ...(classIdFilter ? { class_id: classIdFilter } : {}),
                },
              }}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                rangeKey === opt.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Severity filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            Severity
          </span>
          {[
            { key: null as SeverityFilter, label: 'All' },
            { key: 'high' as const, label: 'High' },
            { key: 'medium' as const, label: 'Medium' },
            { key: 'low' as const, label: 'Low' },
          ].map((opt) => (
            <Link
              key={opt.label}
              href={{
                pathname: '/logs',
                query: {
                  range: rangeKey,
                  ...(opt.key ? { severity: opt.key } : {}),
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(studentIdFilter ? { student_id: studentIdFilter } : {}),
                  ...(classIdFilter ? { class_id: classIdFilter } : {}),
                },
              }}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                severityFilter === opt.key
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            Category
          </span>
          {[
            { key: null as CategoryFilter, label: 'All' },
            { key: 'disruption' as const, label: 'Disruption' },
            { key: 'work' as const, label: 'Work' },
            { key: 'respect' as const, label: 'Respect' },
            { key: 'safety' as const, label: 'Safety' },
            { key: 'other' as const, label: 'Other' },
          ].map((opt) => (
            <Link
              key={opt.label}
              href={{
                pathname: '/logs',
                query: {
                  range: rangeKey,
                  ...(severityFilter ? { severity: severityFilter } : {}),
                  ...(opt.key ? { category: opt.key } : {}),
                  ...(studentIdFilter ? { student_id: studentIdFilter } : {}),
                  ...(classIdFilter ? { class_id: classIdFilter } : {}),
                },
              }}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                categoryFilter === opt.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Summary strip */}
      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
          <p className="text-[11px] font-semibold text-slate-500">
            Total logs
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {totalLogs}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
          <p className="text-[11px] font-semibold text-rose-600">
            High severity
          </p>
          <p className="mt-1 text-lg font-semibold text-rose-700">
            {highCount}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
          <p className="text-[11px] font-semibold text-amber-600">
            Medium severity
          </p>
          <p className="mt-1 text-lg font-semibold text-amber-700">
            {mediumCount}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
          <p className="text-[11px] font-semibold text-emerald-600">
            Low severity
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-700">
            {lowCount}
          </p>
        </div>
      </section>

      {/* Logs table */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 text-left">
                  Date / Time
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-left">
                  Student
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-left">
                  Class / Room
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-left">
                  Severity
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-left">
                  Category
                </th>
                <th className="border-b border-slate-200 px-3 py-2 text-left">
                  Summary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-xs text-slate-500"
                  >
                    No logs found for this range and filter combination.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-3 py-2 align-top text-[11px] text-slate-600">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {log.student_id ? (
                        <Link
                          href={`/students/${log.student_id}`}
                          className="font-medium text-slate-800 underline underline-offset-2"
                        >
                          {studentDisplayName(log.students)}
                        </Link>
                      ) : (
                        studentDisplayName(log.students)
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      <div className="space-y-0.5">
                        <p className="font-medium">
                          {classDisplayName(log.classes)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Room:{' '}
                          {log.classes?.room ||
                            log.room ||
                            'Not specified'}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px]">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          log.severity === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : log.severity === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : log.severity === 'low'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {log.severity
                          ? log.severity.charAt(0).toUpperCase() +
                            log.severity.slice(1)
                          : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {log.category
                        ? log.category.charAt(0).toUpperCase() +
                          log.category.slice(1)
                        : 'Uncategorized'}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                      {log.summary || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

