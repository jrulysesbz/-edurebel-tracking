import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';
import PrintButton from '@/components/PrintButton';

type RangeKey = '7d' | '30d' | '90d' | '12m';

type SeverityFilter = 'high' | 'medium' | 'low' | null;
type CategoryFilter =
  | 'disruption'
  | 'work'
  | 'respect'
  | 'safety'
  | 'other'
  | null;

type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

interface BehaviorLogWithRelations extends BehaviorLogRow {
  students: Pick<StudentRow, 'id' | 'first_name' | 'last_name' | 'code'> | null;
  classes: Pick<ClassRow, 'id' | 'name' | 'room'> | null;
}

function getRangeInfo(raw?: string | null) {
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

function normalizeSeverity(param: string | null | undefined): SeverityFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return null;
}

function normalizeCategory(param: string | null | undefined): CategoryFilter {
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

function studentDisplayName(
  s: BehaviorLogWithRelations['students'],
): string {
  if (!s) return 'Unknown student';
  const parts = [s.first_name, s.last_name].filter(Boolean);
  const base = parts.length > 0 ? parts.join(' ') : s.code || 'Unknown student';
  if (s.code) {
    return `${base} (${s.code})`;
  }
  return base;
}

function classDisplayName(c: BehaviorLogWithRelations['classes']): string {
  if (!c) return 'Unknown class';
  return c.name || 'Unknown class';
}

function formatDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

type SearchParamsInput =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>
  | undefined;

interface PageProps {
  searchParams: SearchParamsInput;
}

function getFirstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LogsPage({ searchParams }: PageProps) {
  const resolved = (await searchParams) as
    | Record<string, string | string[] | undefined>
    | undefined;

  const rangeParamRaw = resolved?.range;
  const severityParamRaw = resolved?.severity;
  const categoryParamRaw = resolved?.category;
  const studentIdRaw = resolved?.student_id;
  const classIdRaw = resolved?.class_id;

  const rangeParam = getFirstParam(rangeParamRaw);
  const severityParam = getFirstParam(severityParamRaw);
  const categoryParam = getFirstParam(categoryParamRaw);
  const studentIdFilter = getFirstParam(studentIdRaw) ?? null;
  const classIdFilter = getFirstParam(classIdRaw) ?? null;

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(rangeParam);
  const severityFilter = normalizeSeverity(severityParam);
  const categoryFilter = normalizeCategory(categoryParam);

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
  if (severityFilter) {
    query = query.eq('severity', severityFilter);
  }
  if (categoryFilter) {
    query = query.eq('category', categoryFilter);
  }
  if (studentIdFilter) {
    query = query.eq('student_id', studentIdFilter);
  }
  if (classIdFilter) {
    query = query.eq('class_id', classIdFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading behavior logs', error);
    return (
      <main className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Behavior logs
          </h1>
        </header>
        <p className="text-sm text-red-600">
          Error loading behavior logs. Please try again or contact an
          administrator.
        </p>
      </main>
    );
  }

  const logs = (data ?? []) as BehaviorLogWithRelations[];

  const totalLogs = logs.length;
  const highCount = logs.filter((log) => log.severity === 'high').length;
  const mediumCount = logs.filter((log) => log.severity === 'medium').length;
  const lowCount = logs.filter((log) => log.severity === 'low').length;

  const exportUrl = `/api/logs-export?range=${encodeURIComponent(
    rangeKey,
  )}${severityFilter ? `&severity=${encodeURIComponent(severityFilter)}` : ''}${
    categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''
  }${studentIdFilter ? `&student_id=${encodeURIComponent(studentIdFilter)}` : ''}${
    classIdFilter ? `&class_id=${encodeURIComponent(classIdFilter)}` : ''
  }`;

  return (
    <main className="space-y-4">
      {/* Header + actions */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Behavior logs
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Range: {rangeLabel}
          </p>
          <p className="text-sm text-slate-600">
            Raw behavior log stream across the school. Use filters to focus on
            a time window, severity, category, or a single student / class.
          </p>
          {(studentIdFilter || classIdFilter) && (
            <p className="text-[11px] text-slate-500">
              Active filters:
              {studentIdFilter && (
                <span className="ml-1">
                  Student ID{' '}
                  <code className="text-[10px]">{studentIdFilter}</code>
                </span>
              )}
              {classIdFilter && (
                <span className="ml-1">
                  Class ID{' '}
                  <code className="text-[10px]">{classIdFilter}</code>
                </span>
              )}
            </p>
          )}
        </div>

        <div className="no-print flex items-center gap-2">
          <PrintButton label="Print logs" />
          <a
            href={exportUrl}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Export CSV
          </a>
          {(studentIdFilter || classIdFilter) && (
            <Link
              href={{
                pathname: '/logs',
                query: {
                  range: rangeKey,
                  ...(severityFilter ? { severity: severityFilter } : {}),
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                },
              }}
              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear student/class filter
            </Link>
          )}
        </div>
      </header>

      {/* Legend */}
      <section className="no-print rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <p className="font-semibold text-slate-700">How to use this view</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>
            <span className="font-semibold">Range</span> controls the time
            window.
          </li>
          <li>
            <span className="font-semibold">Severity</span> and{' '}
            <span className="font-semibold">Category</span> focus the types of
            behavior you see.
          </li>
          <li>
            When you arrive from a student or class report, the filters match
            that context automatically.
          </li>
        </ul>
      </section>

      {/* Filters toolbar */}
      <section className="no-print flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Range */}
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

        {/* Severity */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            Severity
          </span>
          {[
            { key: null, label: 'All' },
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

        {/* Category */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            Category
          </span>
          {[
            { key: null, label: 'All' },
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

      {/* Summary cards */}
      <section className="grid gap-3 text-xs sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500">
            Total logs
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {totalLogs}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-rose-600">High</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {highCount}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-amber-600">Medium</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {mediumCount}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600">Low</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {lowCount}
          </p>
        </div>
      </section>

      {/* Table */}
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Log details
          </h2>
          <p className="text-[11px] text-slate-500">
            Showing {logs.length} log{logs.length === 1 ? '' : 's'} in this
            view.
          </p>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-2 py-1 text-left">Date/Time</th>
                <th className="px-2 py-1 text-left">Student</th>
                <th className="px-2 py-1 text-left">Class / Room</th>
                <th className="px-2 py-1 text-left">Severity</th>
                <th className="px-2 py-1 text-left">Category</th>
                <th className="px-2 py-1 text-left">Summary</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-2 py-6 text-center text-[12px] text-slate-500"
                  >
                    No logs match the current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 align-top last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-2 py-1 align-top text-[11px] text-slate-600">
                      {formatDateTimeLocal(log.created_at)}
                    </td>
                    <td className="px-2 py-1 align-top">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-medium text-slate-800">
                          {studentDisplayName(log.students)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1 align-top text-[12px] text-slate-700">
                      <div className="flex flex-col">
                        <span>{classDisplayName(log.classes)}</span>
                        <span className="text-[11px] text-slate-500">
                          Room {log.classes?.room || log.room || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1 align-top text-[11px]">
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize">
                        {log.severity || '—'}
                      </span>
                    </td>
                    <td className="px-2 py-1 align-top text-[11px] capitalize text-slate-700">
                      {log.category || '—'}
                    </td>
                    <td className="px-2 py-1 align-top text-[12px] text-slate-700">
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

