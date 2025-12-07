import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';

type RangeKey = '7d' | '30d' | '90d' | '12m';
type SeverityFilter = 'high' | 'medium' | 'low' | null;
type CategoryFilter = 'disruption' | 'work' | 'respect' | 'safety' | 'other' | null;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type BehaviorLogRow = {
  id: string;
  created_at: string | null;
  student_id: string | null;
  class_id: string | null;
  room: string | null;
  category: string | null;
  severity: string | null;
  summary: string | null;
  students: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    code: string | null;
  } | null;
  classes: {
    id: string;
    name: string;
    room: string | null;
  } | null;
};

function getRangeInfo(
  param?: string | null,
): { key: RangeKey; fromIso: string | null; label: string } {
  const now = new Date();
  const from = new Date(now);
  let key: RangeKey = '30d';
  let label = 'Last 30 days';

  if (param === '7d') {
    key = '7d';
    label = 'Last 7 days';
    from.setDate(now.getDate() - 7);
  } else if (param === '90d') {
    key = '90d';
    label = 'Last 90 days';
    from.setDate(now.getDate() - 90);
  } else if (param === '12m') {
    key = '12m';
    label = 'Last 12 months';
    from.setFullYear(now.getFullYear() - 1);
  } else {
    key = '30d';
    label = 'Last 30 days';
    from.setDate(now.getDate() - 30);
  }

  return {
    key,
    fromIso: from.toISOString(),
    label,
  };
}

function normalizeSeverity(param?: string | null): SeverityFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return null;
}

function normalizeCategory(param?: string | null): CategoryFilter {
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

async function getLogs(
  rangeKey: RangeKey,
  fromIso: string | null,
  severity: SeverityFilter,
  category: CategoryFilter,
  studentId?: string,
  classId?: string,
): Promise<BehaviorLogRow[]> {
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
    console.error('Error loading behavior logs', error);
    return [];
  }

  return (data || []) as BehaviorLogRow[];
}

export default async function LogsPage({ searchParams }: PageProps) {
  const resolvedSearch = await searchParams;

  const rangeParamRaw = resolvedSearch?.range;
  const rangeParam =
    Array.isArray(rangeParamRaw) && rangeParamRaw.length > 0
      ? rangeParamRaw[0]
      : rangeParamRaw;

  const severityParamRaw = resolvedSearch?.severity;
  const severityParam =
    Array.isArray(severityParamRaw) && severityParamRaw.length > 0
      ? severityParamRaw[0]
      : severityParamRaw;

  const categoryParamRaw = resolvedSearch?.category;
  const categoryParam =
    Array.isArray(categoryParamRaw) && categoryParamRaw.length > 0
      ? categoryParamRaw[0]
      : categoryParamRaw;

  const studentParamRaw = resolvedSearch?.student_id;
  const studentParam =
    Array.isArray(studentParamRaw) && studentParamRaw.length > 0
      ? studentParamRaw[0]
      : studentParamRaw;

  const classParamRaw = resolvedSearch?.class_id;
  const classParam =
    Array.isArray(classParamRaw) && classParamRaw.length > 0
      ? classParamRaw[0]
      : classParamRaw;

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(
    rangeParam as string | undefined,
  );

  const severityFilter = normalizeSeverity(severityParam as string | undefined);
  const categoryFilter = normalizeCategory(categoryParam as string | undefined);
  const studentFilter =
    typeof studentParam === 'string' && studentParam.length > 0
      ? studentParam
      : undefined;
  const classFilter =
    typeof classParam === 'string' && classParam.length > 0
      ? classParam
      : undefined;

  const logs = await getLogs(
    rangeKey,
    fromIso,
    severityFilter,
    categoryFilter,
    studentFilter,
    classFilter,
  );

  const exportUrl = `/api/logs-export?range=${encodeURIComponent(
    rangeKey,
  )}${
    severityFilter ? `&severity=${encodeURIComponent(severityFilter)}` : ''
  }${
    categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''
  }${
    studentFilter ? `&student_id=${encodeURIComponent(studentFilter)}` : ''
  }${classFilter ? `&class_id=${encodeURIComponent(classFilter)}` : ''}`;

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Behavior logs</h1>
          <p className="text-xs font-medium text-slate-500">
            Range: {rangeLabel}
          </p>
          <p className="text-sm text-slate-600">
            Filter, export, and click through to student and class reports for deeper
            analysis.
          </p>
        </div>
        <div className="no-print mt-2 flex items-center gap-2 sm:mt-0">
          <a
            href={exportUrl}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Export CSV
          </a>
        </div>
      </header>

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
                  ...(studentFilter ? { student_id: studentFilter } : {}),
                  ...(classFilter ? { class_id: classFilter } : {}),
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
                  ...(studentFilter ? { student_id: studentFilter } : {}),
                  ...(classFilter ? { class_id: classFilter } : {}),
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
                  ...(studentFilter ? { student_id: studentFilter } : {}),
                  ...(classFilter ? { class_id: classFilter } : {}),
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

      {/* Table */}
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-2 py-1.5">Date / Time</th>
              <th className="px-2 py-1.5">Student</th>
              <th className="px-2 py-1.5">Class</th>
              <th className="px-2 py-1.5">Room</th>
              <th className="px-2 py-1.5">Severity</th>
              <th className="px-2 py-1.5">Category</th>
              <th className="px-2 py-1.5">Summary</th>
              <th className="px-2 py-1.5">Reports</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-2 py-4 text-center text-xs text-slate-500"
                >
                  No logs found for this filter.
                </td>
              </tr>
            )}

            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-2 py-1.5 align-top text-[11px] text-slate-600">
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString()
                    : ''}
                </td>
                <td className="px-2 py-1.5 align-top">
                  <div className="text-xs font-medium text-slate-800">
                    {log.students
                      ? `${[log.students.first_name, log.students.last_name]
                          .filter(Boolean)
                          .join(' ')}${
                          log.students.code ? ` (${log.students.code})` : ''
                        }`
                      : 'Unknown student'}
                  </div>
                </td>
                <td className="px-2 py-1.5 align-top">
                  <div className="text-xs font-medium text-slate-800">
                    {log.classes?.name || 'Unknown class'}
                  </div>
                </td>
                <td className="px-2 py-1.5 align-top text-[11px] text-slate-600">
                  {log.classes?.room || log.room || ''}
                </td>
                <td className="px-2 py-1.5 align-top">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      log.severity === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : log.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : log.severity === 'low'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {log.severity || 'n/a'}
                  </span>
                </td>
                <td className="px-2 py-1.5 align-top text-[11px] capitalize text-slate-700">
                  {log.category || 'other'}
                </td>
                <td className="max-w-xs px-2 py-1.5 align-top text-[11px] text-slate-700">
                  {log.summary}
                </td>
                <td className="px-2 py-1.5 align-top text-[11px]">
                  <div className="flex flex-col gap-1">
                    {log.student_id && (
                      <Link
                        href={`/students/${log.student_id}/report?range=${rangeKey}`}
                        className="text-[11px] font-semibold text-slate-700 underline underline-offset-2"
                      >
                        Student report
                      </Link>
                    )}
                    {log.class_id && (
                      <Link
                        href={`/classes/${log.class_id}/report?range=${rangeKey}`}
                        className="text-[11px] font-semibold text-slate-700 underline underline-offset-2"
                      >
                        Class report
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

