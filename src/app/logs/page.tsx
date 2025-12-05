import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

export const dynamic = 'force-dynamic';

type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

function getStudentDisplayName(student: StudentRow | null | undefined): string {
  if (!student) return '—';
  const anyStudent = student as any;

  const full = anyStudent.full_name?.trim?.();
  if (full) return full;

  const first = anyStudent.first_name ?? '';
  const last = anyStudent.last_name ?? '';
  const combined = `${first} ${last}`.trim();

  return combined || 'Unnamed student';
}

function getClassDisplayName(cls: ClassRow | null | undefined): string {
  if (!cls) return '—';
  const anyClass = cls as any;
  return (
    anyClass.name ??
    anyClass.code ??
    anyClass.room ??
    'Class'
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function computeFromDate(rangeParam: string | undefined): string | null {
  const map: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  if (!rangeParam || rangeParam === 'all') return null;

  const days = map[rangeParam];
  if (!days) return null;

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return from.toISOString();
}

async function getLogsWithContext(opts: {
  studentId?: string;
  classId?: string;
  range?: string;
}) {
  const { studentId, classId, range } = opts;
  const supabaseAny = supabase as any;

  const fromIso = computeFromDate(range);

  // 1) Load logs with filters
  let query = supabaseAny
    .from('behavior_logs')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (studentId) {
    query = query.eq('student_id', studentId);
  }
  if (classId) {
    query = query.eq('class_id', classId);
  }
  if (fromIso) {
    query = query.gte('occurred_at', fromIso);
  }

  const { data: logs, error: logsError } = await query;

  if (logsError) {
    console.error('Error loading behavior_logs', logsError);
  }

  const safeLogs = (logs ?? []) as BehaviorLogRow[];

  // 2) Load students and classes for mapping
  const [{ data: students, error: studentsError }, { data: classes, error: classesError }] =
    await Promise.all([
      supabaseAny.from('students').select('*'),
      supabaseAny.from('classes').select('*'),
    ]);

  if (studentsError) {
    console.error('Error loading students for logs page', studentsError);
  }
  if (classesError) {
    console.error('Error loading classes for logs page', classesError);
  }

  const studentMap = new Map<string, StudentRow>();
  (students ?? []).forEach((s: any) => {
    if (s && s.id) {
      studentMap.set(s.id as string, s as StudentRow);
    }
  });

  const classMap = new Map<string, ClassRow>();
  (classes ?? []).forEach((c: any) => {
    if (c && c.id) {
      classMap.set(c.id as string, c as ClassRow);
    }
  });

  return {
    logs: safeLogs,
    studentMap,
    classMap,
  };
}

export default async function LogsPage(props: {
  searchParams: Promise<{
    student_id?: string;
    class_id?: string;
    range?: string;
  }>;
}) {
  const searchParams = await props.searchParams;

  const studentId = searchParams.student_id || undefined;
  const classId = searchParams.class_id || undefined;
  const range = searchParams.range || '7d';

  const { logs, studentMap, classMap } = await getLogsWithContext({
    studentId,
    classId,
    range,
  });

  return (
    <main className="space-y-6">
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Behavior logs</h1>
          <p className="text-sm text-slate-600">
            Filter by student, class, or date range and review recent behavior across rooms.
          </p>
        </div>

        <Link
          href="/logs/new"
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
        >
          + New log
        </Link>
      </header>

      {/* Filters */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 sm:grid-cols-4" method="get">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Student ID
            </label>
            <input
              type="text"
              name="student_id"
              defaultValue={studentId ?? ''}
              className="h-8 rounded-md border border-slate-200 px-2 text-xs"
              placeholder="Paste student UUID"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Class ID
            </label>
            <input
              type="text"
              name="class_id"
              defaultValue={classId ?? ''}
              className="h-8 rounded-md border border-slate-200 px-2 text-xs"
              placeholder="Paste class UUID"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
              Date range
            </label>
            <select
              name="range"
              defaultValue={range}
              className="h-8 rounded-md border border-slate-200 px-2 text-xs"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-8 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
            >
              Apply filters
            </button>
          </div>
        </form>
      </section>

      {/* Logs table */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Recent behavior logs
        </h2>

        {logs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No behavior logs found for the selected filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-1.5">Date</th>
                  <th className="px-2 py-1.5">Student</th>
                  <th className="px-2 py-1.5">Class</th>
                  <th className="px-2 py-1.5">Level</th>
                  <th className="px-2 py-1.5">Summary</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const anyLog = log as any;
                  const student = log.student_id
                    ? studentMap.get(log.student_id as string)
                    : null;
                  const cls = log.class_id
                    ? classMap.get(log.class_id as string)
                    : null;

                  const level = (anyLog.level as string | null | undefined) ?? '—';
                  const summary =
                    (anyLog.summary as string | null | undefined) ?? 'No summary';

                  return (
                    <tr
                      key={log.id as string}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-2 py-1.5 align-top text-[11px] text-slate-600">
                        {formatDateTime(anyLog.occurred_at as string)}
                      </td>
                      <td className="px-2 py-1.5 align-top text-[11px] text-slate-800">
                        {getStudentDisplayName(student ?? undefined)}
                      </td>
                      <td className="px-2 py-1.5 align-top text-[11px] text-slate-800">
                        {getClassDisplayName(cls ?? undefined)}
                      </td>
                      <td className="px-2 py-1.5 align-top text-[11px]">
                        <span className="inline-flex rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {level}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 align-top text-[11px] text-slate-800">
                        {summary}
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

