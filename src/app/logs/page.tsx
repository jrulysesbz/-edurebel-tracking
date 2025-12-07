import Link from 'next/link';
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
  searchParams: Promise<PageSearchParams>;
};

type SeverityFilter = 'high' | 'medium' | 'low' | null;
type CategoryFilter = 'disruption' | 'work' | 'respect' | 'safety' | 'other' | null;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

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

function normalizeSeverity(param: string | undefined): SeverityFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return null;
}

function normalizeCategory(param: string | undefined): CategoryFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (v === 'disruption' || v === 'work' || v === 'respect' || v === 'safety' || v === 'other') {
    return v;
  }
  return null;
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

export default async function LogsPage({ searchParams }: PageProps) {
  const resolvedSearch = await searchParams;

  const rangeParamRaw = resolvedSearch?.range;
  const rangeParam = firstParam(rangeParamRaw);

  const severityParamRaw = resolvedSearch?.severity;
  const severityParam = firstParam(severityParamRaw);

  const categoryParamRaw = resolvedSearch?.category;
  const categoryParam = firstParam(categoryParamRaw);

  const studentIdRaw = resolvedSearch?.student_id;
  const studentId = firstParam(studentIdRaw);

  const classIdRaw = resolvedSearch?.class_id;
  const classId = firstParam(classIdRaw);

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(rangeParam);
  const severityFilter = normalizeSeverity(severityParam);
  const categoryFilter = normalizeCategory(categoryParam);

  const supabaseAny = supabase as any;

  let logsQuery = supabaseAny
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
    logsQuery = logsQuery.gte('created_at', fromIso);
  }

  if (severityFilter) {
    logsQuery = logsQuery.eq('severity', severityFilter);
  }

  if (categoryFilter) {
    logsQuery = logsQuery.eq('category', categoryFilter);
  }

  if (studentId) {
    logsQuery = logsQuery.eq('student_id', studentId);
  }

  if (classId) {
    logsQuery = logsQuery.eq('class_id', classId);
  }

  const { data: logsData, error: logsError } = await logsQuery;

  if (logsError) {
    console.error('Error loading logs in /logs', logsError);
  }

  const logs: BehaviorLogWithRefs[] = (logsData ?? []) as BehaviorLogWithRefs[];

  const totalLogs = logs.length;
  const highCount = logs.filter((l) => l.severity === 'high').length;
  const mediumCount = logs.filter((l) => l.severity === 'medium').length;
  const lowCount = logs.filter((l) => l.severity === 'low').length;
  const studentCount = new Set(
    logs.map((l) => l.students?.id).filter((v): v is string => Boolean(v)),
  ).size;
  const classCount = new Set(
    logs.map((l) => l.classes?.id).filter((v): v is string => Boolean(v)),
  ).size;

  let activeStudentLabel: string | null = null;
  if (studentId && logs.length > 0) {
    const match = logs.find((l) => l.students && l.students.id === studentId);
    if (match && match.students) {
      const s = match.students;
      activeStudentLabel =
        `${s.last_name ?? ''}${s.first_name ?? ''}${
          s.code ? ` (${s.code})` : ''
        }`.trim() || studentId;
    } else {
      activeStudentLabel = studentId;
    }
  }

  let activeClassLabel: string | null = null;
  if (classId && logs.length > 0) {
    const match = logs.find((l) => l.classes && l.classes.id === classId);
    if (match && match.classes) {
      const c = match.classes;
      activeClassLabel =
        `${c.name ?? ''}${c.room ? ` · ${c.room}` : ''}`.trim() || classId;
    } else {
      activeClassLabel = classId;
    }
  }

  return (
    <main className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Behavior logs</h1>
          <p className="text-xs font-medium text-slate-500">
            Range: {rangeLabel}
          </p>
          <p className="text-sm text-slate-600">
            Live log explorer for all behavior entries. Use the filters to narrow
            by time window, severity, category, student, or class. Great for SSTs,
            admin meetings, and pattern checks.
          </p>
          {(studentId || classId) && (
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
              {studentId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                  <span className="font-semibold">Student:</span>
                  <span>{activeStudentLabel ?? studentId}</span>
                  <Link
                    href={{
                      pathname: '/logs',
                      query: {
                        range: rangeKey,
                        ...(severityFilter ? { severity: severityFilter } : {}),
                        ...(categoryFilter ? { category: categoryFilter } : {}),
                        ...(classId ? { class_id: classId } : {}),
                      },
                    }}
                    className="ml-1 text-[10px] font-semibold text-slate-700 underline underline-offset-2"
                  >
                    Clear
                  </Link>
                </span>
              )}
              {classId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                  <span className="font-semibold">Class:</span>
                  <span>{activeClassLabel ?? classId}</span>
                  <Link
                    href={{
                      pathname: '/logs',
                      query: {
                        range: rangeKey,
                        ...(severityFilter ? { severity: severityFilter } : {}),
                        ...(categoryFilter ? { category: categoryFilter } : {}),
                        ...(studentId ? { student_id: studentId } : {}),
                      },
                    }}
                    className="ml-1 text-[10px] font-semibold text-slate-700 underline underline-offset-2"
                  >
                    Clear
                  </Link>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="no-print flex items-center gap-2">
          <PrintButton label="Print logs view" />
        </div>
      </header>

      {/* Legend / helper */}
      <section className="no-print rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <p className="font-semibold text-slate-700">How to use this page</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>
            <span className="font-semibold">Range</span> sets the time window
            (7d, 30d, 90d, 12m). All counts and printouts respect this.
          </li>
          <li>
            <span className="font-semibold">Severity</span> focuses the view on low,
            medium, or high concern logs.
          </li>
          <li>
            <span className="font-semibold">Category</span> narrows to disruption,
            work, respect, safety, or other notes.
          </li>
          <li>
            Filters from the student/class reports show here too — use{' '}
            <span className="font-semibold">View in logs</span> to drill into a
            student or class, then adjust filters as needed.
          </li>
        </ul>
      </section>

      {/* Filter toolbar */}
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
                  ...(studentId ? { student_id: studentId } : {}),
                  ...(classId ? { class_id: classId } : {}),
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
            { key: null as SeverityFilter, label: 'All' },
            { key: 'high' as SeverityFilter, label: 'High' },
            { key: 'medium' as SeverityFilter, label: 'Medium' },
            { key: 'low' as SeverityFilter, label: 'Low' },
          ].map((opt) => (
            <Link
              key={opt.label}
              href={{
                pathname: '/logs',
                query: {
                  range: rangeKey,
                  ...(opt.key ? { severity: opt.key } : {}),
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                  ...(studentId ? { student_id: studentId } : {}),
                  ...(classId ? { class_id: classId } : {}),
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
            { key: null as CategoryFilter, label: 'All' },
            { key: 'disruption' as CategoryFilter, label: 'Disruption' },
            { key: 'work' as CategoryFilter, label: 'Work' },
            { key: 'respect' as CategoryFilter, label: 'Respect' },
            { key: 'safety' as CategoryFilter, label: 'Safety' },
            { key: 'other' as CategoryFilter, label: 'Other' },
          ].map((opt) => (
            <Link
              key={opt.label}
              href={{
                pathname: '/logs',
                query: {
                  range: rangeKey,
                  ...(severityFilter ? { severity: severityFilter } : {}),
                  ...(opt.key ? { category: opt.key } : {}),
                  ...(studentId ? { student_id: studentId } : {}),
                  ...(classId ? { class_id: classId } : {}),
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

      {/* Summary chips */}
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

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Students involved
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{studentCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Classes involved
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{classCount}</p>
        </div>
      </section>

      {/* Logs table */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
          Logs ({totalLogs})
        </div>
        <div className="max-h-[600px] overflow-auto text-xs">
          <table className="min-w-full border-separate border-spacing-y-1">
            <thead className="sticky top-0 bg-white">
              <tr className="text-[11px] text-slate-500">
                <th className="px-3 py-1 text-left">Date / Time</th>
                <th className="px-3 py-1 text-left">Student</th>
                <th className="px-3 py-1 text-left">Class / Room</th>
                <th className="px-3 py-1 text-left">Severity</th>
                <th className="px-3 py-1 text-left">Category</th>
                <th className="px-3 py-1 text-left">Summary</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const stu = log.students;
                const cls = log.classes;
                const studentLabel = stu
                  ? `${stu.last_name ?? ''}${stu.first_name ?? ''}${
                      stu.code ? ` (${stu.code})` : ''
                    }`.trim() || 'Unknown student'
                  : 'Unknown student';

                const classLabel = cls
                  ? `${cls.name ?? ''}${cls.room ? ` · ${cls.room}` : ''}`.trim()
                  : log.room || '—';

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
                      {classLabel}
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
                    No logs match these filters yet.
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

