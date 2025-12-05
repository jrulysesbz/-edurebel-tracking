import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

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

async function getDashboardData() {
  const supabaseAny = supabase as any;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    studentsCountRes,
    classesCountRes,
    logs7dCountRes,
    recentLogsRes,
    classesListRes,
    heatLogsRes,
  ] = await Promise.all([
    supabaseAny
      .from('students')
      .select('id', { count: 'exact', head: true }),
    supabaseAny
      .from('classes')
      .select('id', { count: 'exact', head: true }),
    supabaseAny
      .from('behavior_logs')
      .select('id', { count: 'exact', head: true })
      .gte('occurred_at', sevenDaysAgo.toISOString()),
    supabaseAny
      .from('behavior_logs')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(5),
    supabaseAny.from('classes').select('*'),
    supabaseAny
      .from('behavior_logs')
      .select('*')
      .gte('occurred_at', thirtyDaysAgo.toISOString()),
  ]);

  const { count: studentCount = 0, error: studentsError } = studentsCountRes;
  const { count: classCount = 0, error: classesCountError } = classesCountRes;
  const { count: logs7dCount = 0, error: logs7dError } = logs7dCountRes;
  const { data: recentLogsRaw, error: recentLogsError } = recentLogsRes;
  const { data: classesRaw, error: classesListError } = classesListRes;
  const { data: heatLogsRaw, error: heatLogsError } = heatLogsRes;

  if (studentsError) {
    console.error('Error counting students', studentsError);
  }
  if (classesCountError) {
    console.error('Error counting classes', classesCountError);
  }
  if (logs7dError) {
    console.error('Error counting logs (7d)', logs7dError);
  }
  if (recentLogsError) {
    console.error('Error loading recent logs', recentLogsError);
  }
  if (classesListError) {
    console.error('Error loading classes list', classesListError);
  }
  if (heatLogsError) {
    console.error('Error loading logs for heat map', heatLogsError);
  }

  const recentLogs = (recentLogsRaw ?? []) as BehaviorLogRow[];
  const classes = (classesRaw ?? []) as ClassRow[];
  const heatLogs = (heatLogsRaw ?? []) as BehaviorLogRow[];

  // Map classes by id
  const classMap = new Map<string, ClassRow>();
  classes.forEach((c: any) => {
    if (c && c.id) {
      classMap.set(c.id as string, c as ClassRow);
    }
  });

  // Build heat map: counts by class & level for last 30 days
  const levelSet = new Set<string>();
  const byClass = new Map<string, Map<string, number>>();

  heatLogs.forEach((log) => {
    const anyLog = log as any;
    const classId = log.class_id as string | null | undefined;
    if (!classId) return;

    const level = (anyLog.level as string | null | undefined) ?? 'Unspecified';
    levelSet.add(level);

    if (!byClass.has(classId)) {
      byClass.set(classId, new Map<string, number>());
    }
    const levelMap = byClass.get(classId)!;
    levelMap.set(level, (levelMap.get(level) ?? 0) + 1);
  });

  const levels = Array.from(levelSet.values()).sort();
  const heatRows = Array.from(byClass.entries()).map(([classId, levelMap]) => {
    const cls = classMap.get(classId) ?? null;
    const row: { classId: string; classLabel: string; counts: Record<string, number> } = {
      classId,
      classLabel: getClassDisplayName(cls),
      counts: {},
    };
    levels.forEach((level) => {
      row.counts[level] = levelMap.get(level) ?? 0;
    });
    return row;
  });

  // Sort heat rows by total count desc
  heatRows.sort((a, b) => {
    const totalA = Object.values(a.counts).reduce((sum, v) => sum + v, 0);
    const totalB = Object.values(b.counts).reduce((sum, v) => sum + v, 0);
    return totalB - totalA;
  });

  return {
    studentCount,
    classCount,
    logs7dCount,
    recentLogs,
    classMap,
    levels,
    heatRows,
  };
}

export default async function HomePage() {
  const { studentCount, classCount, logs7dCount, recentLogs, classMap, levels, heatRows } =
    await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">EDURebel Tracker</h1>
        <p className="mt-1 text-sm text-slate-600">
          At-a-glance view of classes, students, and recent behavior logs.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Students
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {studentCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Total students in the tracker.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Classes
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {classCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Active classes / homerooms.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Logs (last 7 days)
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {logs7dCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Recent behavior entries across all rooms.
          </p>
        </div>
      </div>

      {/* Heat map */}
      {levels.length > 0 && heatRows.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Class heat map (last 30 days)
            </h2>
            <Link
              href="/logs"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Open full logs
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-2 py-1.5">Class</th>
                  {levels.map((level) => (
                    <th key={level} className="px-2 py-1.5">
                      {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatRows.map((row) => {
                  const total = Object.values(row.counts).reduce(
                    (sum, v) => sum + v,
                    0,
                  );
                  return (
                    <tr
                      key={row.classId}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-2 py-1.5 align-top text-[11px] text-slate-800">
                        {row.classLabel}
                        <div className="mt-0.5 text-[10px] text-slate-500">
                          {total} log{total === 1 ? '' : 's'}
                        </div>
                      </td>
                      {levels.map((level) => {
                        const value = row.counts[level] ?? 0;
                        const intensity =
                          value === 0
                            ? 'bg-slate-50 text-slate-400'
                            : value <= 2
                            ? 'bg-amber-50 text-amber-700'
                            : value <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-amber-200 text-amber-900';

                        return (
                          <td
                            key={level}
                            className="px-2 py-1.5 align-top text-[11px]"
                          >
                            <span
                              className={`inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 ${intensity}`}
                            >
                              {value}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent logs */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Recent behavior logs
          </h2>
          <Link
            href="/logs"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No logs recorded yet. Once you start logging behavior, the latest entries
            will show up here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {recentLogs.map((log) => {
              const anyLog = log as any;
              const cls = log.class_id
                ? classMap.get(log.class_id as string)
                : null;
              const level = (anyLog.level as string | null | undefined) ?? '—';
              const summary =
                (anyLog.summary as string | null | undefined) ?? 'No summary';

              return (
                <li
                  key={log.id as string}
                  className="flex items-start justify-between gap-2 py-2"
                >
                  <div className="flex flex-col">
                    <p className="font-medium text-slate-800">
                      {summary}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDateTime(anyLog.occurred_at as string)}
                      {cls && (
                        <span className="ml-2">
                          · {getClassDisplayName(cls)}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {level}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href="/students"
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
        >
          Go to students
        </Link>
        <Link
          href="/classes"
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
        >
          Go to classes
        </Link>
        <Link
          href="/rooms"
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
        >
          Go to rooms
        </Link>
        <Link
          href="/logs"
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:bg-slate-100"
        >
          Go to logs
        </Link>
      </div>
    </div>
  );
}

