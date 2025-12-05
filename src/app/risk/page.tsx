// =========================================================
// src/app/risk/page.tsx
// Global Risk Dashboard with range filters
// =========================================================

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

export const dynamic = 'force-dynamic';

type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

type RangeKey = '7d' | '30d' | '90d';

type GlobalRiskSummary = {
  totalLogsInRange: number;
  totalLogs7d: number;
  uniqueStudentsInRange: number;
  uniqueClassesInRange: number;
};

type RiskStudentRow = {
  id: string;
  fullName: string;
  code: string | null;
  className: string | null;
  logsInRange: number;
};

type RiskClassRow = {
  id: string;
  name: string | null;
  room: string | null;
  logsInRange: number;
};

type Severity = {
  label: string;
  className: string;
};

type RiskDashboardData = {
  summary: GlobalRiskSummary;
  topStudents: RiskStudentRow[];
  topClasses: RiskClassRow[];
};

function getRangeConfig(param?: string): {
  key: RangeKey;
  label: string;
  days: number;
} {
  if (param === '7d') {
    return { key: '7d', label: '7 days', days: 7 };
  }
  if (param === '90d') {
    return { key: '90d', label: '90 days', days: 90 };
  }
  return { key: '30d', label: '30 days', days: 30 };
}

function getStudentSeverity(count: number): Severity {
  if (count >= 8) {
    return {
      label: 'High',
      className: 'bg-rose-100 text-rose-800',
    };
  }
  if (count >= 4) {
    return {
      label: 'Medium',
      className: 'bg-amber-100 text-amber-800',
    };
  }
  if (count >= 1) {
    return {
      label: 'Watch',
      className: 'bg-sky-100 text-sky-800',
    };
  }
  return {
    label: 'Calm',
    className: 'bg-emerald-100 text-emerald-800',
  };
}

function getClassSeverity(count: number): Severity {
  if (count >= 12) {
    return {
      label: 'High',
      className: 'bg-rose-100 text-rose-800',
    };
  }
  if (count >= 6) {
    return {
      label: 'Medium',
      className: 'bg-amber-100 text-amber-800',
    };
  }
  if (count >= 1) {
    return {
      label: 'Watch',
      className: 'bg-sky-100 text-sky-800',
    };
  }
  return {
    label: 'Calm',
    className: 'bg-emerald-100 text-emerald-800',
  };
}

async function getRiskDashboardData(range: {
  key: RangeKey;
  days: number;
}): Promise<RiskDashboardData> {
  const supabaseAny = supabase as any;

  const now = new Date();
  const fromRange = new Date(now);
  fromRange.setDate(fromRange.getDate() - range.days);

  const from7 = new Date(now);
  from7.setDate(from7.getDate() - 7);

  const fromRangeIso = fromRange.toISOString();

  try {
    // 1) Load all logs from the selected range
    const { data: logsData, error: logsError } = await supabaseAny
      .from('behavior_logs')
      .select('id, created_at, student_id, class_id')
      .gte('created_at', fromRangeIso);

    if (logsError) {
      console.error('Error loading behavior logs for risk dashboard', logsError);
      return {
        summary: {
          totalLogsInRange: 0,
          totalLogs7d: 0,
          uniqueStudentsInRange: 0,
          uniqueClassesInRange: 0,
        },
        topStudents: [],
        topClasses: [],
      };
    }

    const logs = (logsData ?? []) as Pick<
      BehaviorLogRow,
      'id' | 'created_at' | 'student_id' | 'class_id'
    >[];

    // 2) Global summary
    const totalLogsInRange = logs.length;
    const totalLogs7d = logs.filter((l) => {
      const d = new Date(l.created_at as string);
      return d >= from7;
    }).length;

    const uniqueStudentsInRange = new Set(
      logs
        .map((l) => l.student_id)
        .filter(
          (sid): sid is string => typeof sid === 'string' && Boolean(sid)
        )
    ).size;

    const uniqueClassesInRange = new Set(
      logs
        .map((l) => l.class_id)
        .filter(
          (cid): cid is string => typeof cid === 'string' && Boolean(cid)
        )
    ).size;

    const summary: GlobalRiskSummary = {
      totalLogsInRange,
      totalLogs7d,
      uniqueStudentsInRange,
      uniqueClassesInRange,
    };

    // 3) Aggregate per student
    const studentCounts = new Map<string, number>();
    logs.forEach((l) => {
      const sid = l.student_id as string | null;
      if (!sid) return;
      studentCounts.set(sid, (studentCounts.get(sid) ?? 0) + 1);
    });

    const sortedStudentEntries = [...studentCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5

    const topStudentIds = sortedStudentEntries.map(([id]) => id);

    let topStudents: RiskStudentRow[] = [];

    if (topStudentIds.length > 0) {
      const { data: studentsData, error: studentsError } = await supabaseAny
        .from('students')
        .select('id, first_name, last_name, code, class_id')
        .in('id', topStudentIds);

      if (studentsError) {
        console.error('Error loading top students meta', studentsError);
      }

      const students = (studentsData ?? []) as (StudentRow & {
        class_id: StudentRow['class_id'];
      })[];

      const classIds = Array.from(
        new Set(
          students
            .map((s) => s.class_id)
            .filter(
              (cid): cid is string => typeof cid === 'string' && Boolean(cid)
            )
        )
      );

      let classesById = new Map<string, ClassRow>();

      if (classIds.length > 0) {
        const { data: classesData, error: classesError } = await supabaseAny
          .from('classes')
          .select('id, name, room')
          .in('id', classIds);

        if (classesError) {
          console.error('Error loading classes for top students', classesError);
        }

        (classesData ?? []).forEach((c: ClassRow) => {
          classesById.set(c.id as string, c);
        });
      }

      const studentById = new Map<string, (typeof students)[number]>();
      students.forEach((s) => {
        studentById.set(s.id as string, s);
      });

      topStudents = sortedStudentEntries.map(([id, count]) => {
        const s = studentById.get(id);
        const fullName =
          s && (s.first_name || s.last_name)
            ? [s.first_name, s.last_name].filter(Boolean).join(' ')
            : 'Unnamed student';

        const cls =
          s && s.class_id ? classesById.get(s.class_id as string) : null;

        return {
          id,
          fullName,
          code: s?.code ?? null,
          className: cls?.name ?? null,
          logsInRange: count,
        };
      });
    }

    // 4) Aggregate per class
    const classCounts = new Map<string, number>();
    logs.forEach((l) => {
      const cid = l.class_id as string | null;
      if (!cid) return;
      classCounts.set(cid, (classCounts.get(cid) ?? 0) + 1);
    });

    const sortedClassEntries = [...classCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5

    const topClassIds = sortedClassEntries.map(([id]) => id);

    let topClasses: RiskClassRow[] = [];

    if (topClassIds.length > 0) {
      const { data: classesData, error: classesError } = await supabaseAny
        .from('classes')
        .select('id, name, room')
        .in('id', topClassIds);

      if (classesError) {
        console.error('Error loading top classes meta', classesError);
      }

      const classes = (classesData ?? []) as ClassRow[];

      const classById = new Map<string, ClassRow>();
      classes.forEach((c) => {
        classById.set(c.id as string, c);
      });

      topClasses = sortedClassEntries.map(([id, count]) => {
        const c = classById.get(id);
        return {
          id,
          name: c?.name ?? 'Unnamed class',
          room: c?.room ?? null,
          logsInRange: count,
        };
      });
    }

    return {
      summary,
      topStudents,
      topClasses,
    };
  } catch (err) {
    console.error('Unexpected error building risk dashboard', err);
    return {
      summary: {
        totalLogsInRange: 0,
        totalLogs7d: 0,
        uniqueStudentsInRange: 0,
        uniqueClassesInRange: 0,
      },
      topStudents: [],
      topClasses: [],
    };
  }
}

type PageProps = {
  searchParams?: {
    range?: string;
  };
};

export default async function RiskDashboardPage({ searchParams }: PageProps) {
  const { key: rangeKey, label: rangeLabel, days } = getRangeConfig(
    searchParams?.range
  );

  const { summary, topStudents, topClasses } = await getRiskDashboardData({
    key: rangeKey,
    days,
  });

  const rangeOptions: { key: RangeKey; label: string }[] = [
    { key: '7d', label: '7 days' },
    { key: '30d', label: '30 days' },
    { key: '90d', label: '90 days' },
  ];

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Risk dashboard</h1>
        <p className="text-sm text-slate-600">
          Behavior logs across all classes and students. Use this to spot
          hotspots and prioritize support.
        </p>
      </header>

      {/* Range selector */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Showing incidents for{' '}
          <span className="font-semibold text-slate-800">{rangeLabel}</span>.
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
          {rangeOptions.map((opt) => {
            const isActive = opt.key === rangeKey;
            return (
              <Link
                key={opt.key}
                href={`/risk?range=${opt.key}`}
                className={
                  'rounded-full px-3 py-1 text-xs font-medium transition ' +
                  (isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white')
                }
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Summary stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total logs ({rangeLabel})
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {summary.totalLogsInRange}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total logs (last 7 days)
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {summary.totalLogs7d}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Students with logs ({rangeLabel})
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {summary.uniqueStudentsInRange}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Classes with logs ({rangeLabel})
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {summary.uniqueClassesInRange}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top students */}
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Top students by incidents ({rangeLabel})
              </h2>
              <p className="text-xs text-slate-500">
                Click a name to jump to the student detail and logs.
              </p>
            </div>
          </div>

          {topStudents.length === 0 ? (
            <p className="text-sm text-slate-500">
              No student behavior logs in this range.
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
                      Class
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Logs ({rangeLabel})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topStudents.map((s) => {
                    const severity = getStudentSeverity(s.logsInRange);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 align-middle">
                          <div className="flex flex-col">
                            <Link
                              href={`/students/${s.id}`}
                              className="text-sm font-medium text-slate-900 hover:underline"
                            >
                              {s.fullName}
                            </Link>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                              {s.code && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                  {s.code}
                                </span>
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 ${severity.className}`}
                              >
                                {severity.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle text-sm text-slate-700">
                          {s.className ?? '—'}
                        </td>
                        <td className="px-3 py-2 align-middle text-right text-sm text-slate-900">
                          {s.logsInRange}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Top classes */}
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Top classes by incidents ({rangeLabel})
              </h2>
              <p className="text-xs text-slate-500">
                Click a class to see its detail and class report.
              </p>
            </div>
          </div>

          {topClasses.length === 0 ? (
            <p className="text-sm text-slate-500">
              No class behavior logs in this range.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Class
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Room
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Logs ({rangeLabel})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topClasses.map((c) => {
                    const severity = getClassSeverity(c.logsInRange);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 align-middle">
                          <div className="flex flex-col">
                            <Link
                              href={`/classes/${c.id}`}
                              className="text-sm font-medium text-slate-900 hover:underline"
                            >
                              {c.name ?? 'Unnamed class'}
                            </Link>
                            <span
                              className={`mt-0.5 inline-flex w-fit rounded-full px-2 py-0.5 text-xs ${severity.className}`}
                            >
                              {severity.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle text-sm text-slate-700">
                          {c.room ?? '—'}
                        </td>
                        <td className="px-3 py-2 align-middle text-right text-sm text-slate-900">
                          {c.logsInRange}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

