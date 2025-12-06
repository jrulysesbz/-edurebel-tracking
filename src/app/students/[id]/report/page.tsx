// src/app/students/[id]/report/page.tsx
import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';
import PrintButton from '@/components/PrintButton';

type Db = Database['public']['Tables'];

type StudentRow = Db['students']['Row'];
type ClassRow = Db['classes']['Row'];
type BehaviorLogRow = Db['behavior_logs']['Row'];

type RangeKey = '7d' | '30d' | '90d' | '12m' | 'all';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
};

function getRangeInfo(
  rangeParam: string | null
): { key: RangeKey; fromIso: string | null; label: string } {
  const now = new Date();

  switch (rangeParam) {
    case '7d': {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return {
        key: '7d',
        fromIso: from.toISOString(),
        label: 'Last 7 days',
      };
    }
    case '90d': {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return {
        key: '90d',
        fromIso: from.toISOString(),
        label: 'Last 90 days',
      };
    }
    case '12m': {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 12);
      return {
        key: '12m',
        fromIso: from.toISOString(),
        label: 'Last 12 months',
      };
    }
    case 'all': {
      return {
        key: 'all',
        fromIso: null,
        label: 'All time',
      };
    }
    case '30d':
    default: {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return {
        key: '30d',
        fromIso: from.toISOString(),
        label: 'Last 30 days',
      };
    }
  }
}

async function getStudentAndClass(id: string): Promise<{
  student: StudentRow | null;
  classRow: ClassRow | null;
}> {
  const supabaseAny = supabase as any;

  const { data, error } = await supabaseAny
    .from('students')
    .select(
      `
        id,
        first_name,
        last_name,
        code,
        class_id,
        is_live,
        classes:class_id (
          id,
          name,
          room
        )
      `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error loading student for report', error);
    return { student: null, classRow: null };
  }

  if (!data) {
    return { student: null, classRow: null };
  }

  const classRow: ClassRow | null = data.classes
    ? {
        id: data.classes.id,
        name: data.classes.name,
        room: data.classes.room,
        // fill any required fields with null/undefined-safe defaults
        // @ts-expect-error – ignore extra/missing fields from narrow select
      }
    : null;

  const student: StudentRow = {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    code: data.code,
    class_id: data.class_id,
    is_live: data.is_live,
    // @ts-expect-error – ignore other columns we didn't select
  };

  return { student, classRow };
}

async function getStudentLogs(
  studentId: string,
  fromIso: string | null
): Promise<
  (BehaviorLogRow & {
    classes?: { id: string; name: string | null } | null;
  })[]
> {
  const supabaseAny = supabase as any;

  try {
    let query = supabaseAny
      .from('behavior_logs')
      .select(
        `
        id,
        created_at,
        severity,
        category,
        room,
        summary,
        class_id,
        classes:class_id (
          id,
          name
        )
      `
      )
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (fromIso) {
      query = query.gte('created_at', fromIso);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading student logs for report', error);
      return [];
    }

    return (data ?? []) as any[];
  } catch (err) {
    console.error('Unexpected error loading student logs for report', err);
    return [];
  }
}

function summarizeLogs(logs: BehaviorLogRow[]) {
  const bySeverity = new Map<string, number>();
  const byCategory = new Map<string, number>();

  for (const log of logs as any[]) {
    const sev = log.severity ?? 'Unspecified';
    const cat = log.category ?? 'Uncategorized';

    bySeverity.set(sev, (bySeverity.get(sev) ?? 0) + 1);
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
  }

  return {
    total: logs.length,
    bySeverity,
    byCategory,
  };
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-TW', {
      timeZone: 'Asia/Taipei',
    });
  } catch {
    return iso;
  }
}

export default async function StudentReportPage(props: PageProps) {
  const { params, searchParams } = props;

  const { id } = await params;
  const sp = await searchParams;

  const rangeParamRaw = sp?.range;
  const rangeParam =
    Array.isArray(rangeParamRaw) && rangeParamRaw.length > 0
      ? rangeParamRaw[0]
      : rangeParamRaw ?? null;

  const { key: rangeKey, fromIso, label: rangeLabel } =
    getRangeInfo(rangeParam);

  const exportUrl = `/api/student-report-export?student_id=${encodeURIComponent(
    id
  )}&range=${encodeURIComponent(rangeKey)}`;

  const [{ student, classRow }, logs] = await Promise.all([
    getStudentAndClass(id),
    getStudentLogs(id, fromIso),
  ]);

  if (!student) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Student not found
        </h1>
        <p className="text-sm text-slate-600">
          This student could not be found. They may have been removed or
          deactivated.
        </p>
        <Link
          href="/students"
          className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to students
        </Link>
      </div>
    );
  }

  const stats = summarizeLogs(logs as any);

  const studentName = [student.first_name, student.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Student behavior report
          </h1>
          <p className="text-sm text-slate-600">
            Timeline of logs, categories, and risk for this student. Use the
            range filter to control the window, then print or export for
            meetings, SSTs, and parent conferences.
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <PrintButton label="Print student report" />
          <a
            href={exportUrl}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Export CSV
          </a>
        </div>
      </header>

      <nav className="no-print text-xs text-slate-600">
        <Link
          href="/students"
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-500"
        >
          ← Back to students
        </Link>
      </nav>

      {/* Student summary */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              {studentName || 'Unnamed student'}{' '}
              {student.code ? (
                <span className="text-xs font-normal text-slate-500">
                  ({student.code})
                </span>
              ) : null}
            </h2>
            <p className="text-xs text-slate-600">
              Class:{' '}
              {classRow?.name ? (
                <span className="font-medium">
                  {classRow.name}
                  {classRow.room ? ` – Room ${classRow.room}` : ''}
                </span>
              ) : (
                <span className="italic text-slate-500">No class assigned</span>
              )}
            </p>
            <p className="text-xs text-slate-600">
              Status:{' '}
              {student.is_live ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                  Inactive
                </span>
              )}
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Range: {rangeLabel}</div>
            <div>
              Logs in range:{' '}
              <span className="font-semibold text-slate-700">
                {stats.total}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Range filters */}
      <section className="no-print rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
        <form className="flex flex-wrap items-center gap-2" method="get">
          <span className="font-medium">Range:</span>
          {[
            { key: '7d', label: '7d' },
            { key: '30d', label: '30d' },
            { key: '90d', label: '90d' },
            { key: '12m', label: '12m' },
            { key: 'all', label: 'All' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="submit"
              name="range"
              value={opt.key}
              className={[
                'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]',
                rangeKey === opt.key
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </form>
      </section>

      {/* Stats summary */}
      <section className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            By severity
          </h2>
          {stats.bySeverity.size === 0 ? (
            <p className="text-xs text-slate-500">
              No logs in this range for this student.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {Array.from(stats.bySeverity.entries()).map(([sev, count]) => (
                <li key={sev} className="flex items-center justify-between">
                  <span className="truncate">{sev}</span>
                  <span className="ml-2 inline-flex min-w-[2rem] justify-end font-semibold text-slate-800">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            By category
          </h2>
          {stats.byCategory.size === 0 ? (
            <p className="text-xs text-slate-500">
              No categorized logs in this range.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {Array.from(stats.byCategory.entries()).map(([cat, count]) => (
                <li key={cat} className="flex items-center justify-between">
                  <span className="truncate">{cat}</span>
                  <span className="ml-2 inline-flex min-w-[2rem] justify-end font-semibold text-slate-800">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Behavior timeline
        </h2>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-500">
            No behavior logs for this student in the selected range.
          </p>
        ) : (
          <ol className="space-y-3 text-xs">
            {logs.map((log: any) => {
              const dt = formatDateTime(log.created_at);
              const sev = log.severity ?? 'Unspecified';
              const cat = log.category ?? 'Uncategorized';
              const clsName = log.classes?.name ?? classRow?.name ?? '';

              return (
                <li
                  key={log.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">
                        {dt}
                      </span>
                      {clsName ? (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-800">
                          {clsName}
                          {log.room ? ` – Room ${log.room}` : ''}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        {sev}
                      </span>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-800">
                        {cat}
                      </span>
                    </div>
                  </div>

                  {log.summary ? (
                    <p className="mt-1 text-[11px] leading-snug text-slate-700">
                      {log.summary}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

