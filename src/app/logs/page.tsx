import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';
import NewLogForm from './NewLogForm';

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

type SeverityFilter = 'high' | 'medium' | 'low' | null;
type CategoryFilter = 'disruption' | 'work' | 'respect' | 'safety' | 'other' | null;

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

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function severityBadgeClass(severity: string | null): string {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold';
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

async function fetchLogs(
  rangeKey: RangeKey,
  fromIso: string | null,
  severityFilter: SeverityFilter,
  categoryFilter: CategoryFilter,
): Promise<BehaviorLogWithRefs[]> {
  const supabaseAny = supabase as any;

  try {
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

    const { data, error } = await query;

    if (error) {
      console.error('Error loading behavior logs', error);
      return [];
    }

    return (data ?? []) as BehaviorLogWithRefs[];
  } catch (err) {
    console.error('Unexpected error loading behavior logs', err);
    return [];
  }
}

type PageSearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  searchParams: Promise<PageSearchParams>;
};

export default async function LogsPage({ searchParams }: PageProps) {
  const resolvedSearch = await searchParams;

  const rangeParam = firstParam(resolvedSearch.range);
  const severityParam = firstParam(resolvedSearch.severity);
  const categoryParam = firstParam(resolvedSearch.category);

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(rangeParam);
  const severityFilter = normalizeSeverity(severityParam);
  const categoryFilter = normalizeCategory(categoryParam);

  const logs = await fetchLogs(rangeKey, fromIso, severityFilter, categoryFilter);

  const totalLogs = logs.length;
  const highCount = logs.filter((l) => l.severity === 'high').length;
  const studentCount = new Set(
    logs.map((l) => l.student_id).filter((id): id is string => Boolean(id)),
  ).size;

  return (
    <main className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Behavior logs</h1>
        <p className="text-sm text-slate-600">
          Review and filter individual behavior logs across your classes.
        </p>
        <p className="text-xs font-medium text-slate-500">
          Range: {rangeLabel}
          {severityFilter ? ` · Severity: ${severityFilter}` : ''}
          {categoryFilter ? ` · Category: ${categoryFilter}` : ''}
        </p>
      </header>

      {/* Legend / help */}
      <section className="no-print rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <p className="font-semibold text-slate-700">How to use this page</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>
            <span className="font-semibold">Range</span> controls the time window (7d, 30d, 90d,
            12m). All counts and rows respect this.
          </li>
          <li>
            <span className="font-semibold">Severity</span> lets you focus on minor vs serious
            behavior.
          </li>
          <li>
            <span className="font-semibold">Category</span> narrows logs to disruption, work
            habits, respect, safety, or other notes.
          </li>
          <li>
            For overall patterns and hotspots, use the{' '}
            <Link
              href="/risk"
              className="font-semibold text-slate-800 underline underline-offset-2"
            >
              Risk dashboard
            </Link>
            .
          </li>
        </ul>
      </section>

      {/* Summary cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Total logs
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{totalLogs}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            High severity
          </p>
          <p className="mt-1 text-xl font-semibold text-rose-700">{highCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Students involved
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{studentCount}</p>
        </div>
      </section>

      {/* Filters toolbar: Range + Severity + Category */}
      <section className="no-print flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Range filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-slate-500">Range</span>
          {[
            { key: '7d' as RangeKey, label: 'Last 7 days' },
            { key: '30d' as RangeKey, label: 'Last 30 days' },
            { key: '90d' as RangeKey, label: 'Last 90 days' },
            { key: '12m' as RangeKey, label: 'Last 12 months' },
          ].map((opt) => (
            <Link
              key={opt.key}
              href={{
                pathname: '/logs',
                query: {
                  range: opt.key,
                  ...(severityFilter ? { severity: severityFilter } : {}),
                  ...(categoryFilter ? { category: categoryFilter } : {}),
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
          <span className="font-semibold uppercase tracking-wide text-slate-500">Severity</span>
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
          <span className="font-semibold uppercase tracking-wide text-slate-500">Category</span>
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

      {/* Logs table */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
          Logs ({totalLogs})
        </div>
        <div className="max-h-[540px] overflow-auto text-xs">
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
                const student = log.students;
                const cls = log.classes;

                const studentLabel = student
                  ? `${student.last_name ?? ''}${student.first_name ?? ''}${
                      student.code ? ` (${student.code})` : ''
                    }`.trim() || 'Unknown student'
                  : 'Unknown student';

                const classLabel = cls
                  ? `${cls.name}${cls.room ? ` · ${cls.room}` : ''}`
                  : log.room || '—';

                return (
                  <tr key={log.id} className="bg-slate-50">
                    <td className="whitespace-nowrap px-3 py-1 align-top text-[11px] text-slate-600">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : 'Unknown date'}
                    </td>
                    <td className="px-3 py-1 align-top text-[11px] text-slate-800">{studentLabel}</td>
                    <td className="px-3 py-1 align-top text-[11px] text-slate-600">{classLabel}</td>
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
                  <td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-500">
                    No logs in this range / filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick add log */}
      <section className="no-print rounded-lg border border-slate-200 bg-white p-4 text-xs shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Quick add log</h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Use this for quick notes. For richer context, you can also log from a specific student or
          class page.
        </p>
        <div className="mt-3">
          <NewLogForm />
        </div>
      </section>
    </main>
  );
}

