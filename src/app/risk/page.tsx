// =========================================================
// src/app/risk/page.tsx
// =========================================================


import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';
import PrintButton from '@/components/PrintButton';



export const dynamic = 'force-dynamic';

type Db = Database;

// Types for risk data
type RangeKey = '7d' | '30d' | '90d' | 'all';

type StudentRisk = {
  studentId: string;
  fullName: string;
  code: string | null;
  classId: string | null;
  className: string | null;
  classRoom: string | null;
  logCount: number;
};

type ClassRisk = {
  classId: string;
  className: string | null;
  classRoom: string | null;
  logCount: number;
};

type RiskSummary = {
  totalLogs: number;
  studentsWithLogs: number;
  highRiskStudents: number;
  mediumRiskStudents: number;
  lowRiskStudents: number;
};

type RiskData = {
  summary: RiskSummary;
  perStudent: StudentRisk[];
  perClass: ClassRisk[];
};

const RANGE_OPTIONS: { key: RangeKey; label: string; description: string }[] = [
  { key: '7d', label: 'Last 7 days', description: 'Short snapshot for this week.' },
  { key: '30d', label: 'Last 30 days', description: 'Standard view for meetings.' },
  { key: '90d', label: 'Last 90 days', description: 'Quarterly overview.' },
  { key: 'all', label: 'All time', description: 'Historical view (all logs).' },
];

function normalizeRangeKey(raw: string | undefined): RangeKey {
  if (raw === '7d' || raw === '30d' || raw === '90d' || raw === 'all') {
    return raw;
  }
  return '30d';
}

function getRangeInfo(key: RangeKey): { key: RangeKey; fromIso: string | null; label: string } {
  if (key === 'all') {
    return { key, fromIso: null, label: 'All time' };
  }

  const days = key === '7d' ? 7 : key === '30d' ? 30 : 90;
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const opt = RANGE_OPTIONS.find((o) => o.key === key);

  return {
    key,
    fromIso: from.toISOString(),
    label: opt?.label ?? '',
  };
}

async function getRiskData(input: {
  rangeKey: RangeKey;
  fromIso: string | null;
}): Promise<RiskData> {
  const { rangeKey, fromIso } = input;
  const supabaseAny = supabase as any;

  const empty: RiskData = {
    summary: {
      totalLogs: 0,
      studentsWithLogs: 0,
      highRiskStudents: 0,
      mediumRiskStudents: 0,
      lowRiskStudents: 0,
    },
    perStudent: [],
    perClass: [],
  };

  try {
    // 1) Load behavior logs within range
    let logsQuery = supabaseAny
      .from('behavior_logs')
      .select('id, created_at, student_id, class_id');

    if (fromIso) {
      logsQuery = logsQuery.gte('created_at', fromIso);
    }

    const { data: logsData, error: logsError } = await logsQuery;

    if (logsError) {
      console.error('Error loading behavior logs for risk dashboard', logsError);
      return empty;
    }

    const logs =
      (logsData as
        | {
            id: string;
            created_at: string;
            student_id: string | null;
            class_id: string | null;
          }[]
        | null) ?? [];

    if (logs.length === 0) {
      return empty;
    }

    // 2) Collect unique student + class IDs from logs
    const studentIds = Array.from(
      new Set(logs.map((l) => l.student_id).filter((v): v is string => !!v)),
    );
    const classIds = Array.from(
      new Set(logs.map((l) => l.class_id).filter((v): v is string => !!v)),
    );

    // 3) Fetch student + class metadata in parallel
    const [studentsRes, classesRes] = await Promise.all([
      studentIds.length
        ? supabaseAny
            .from('students')
            .select('id, first_name, last_name, code, class_id')
            .in('id', studentIds)
        : { data: [], error: null },
      classIds.length
        ? supabaseAny.from('classes').select('id, name, room').in('id', classIds)
        : { data: [], error: null },
    ]);

    if (studentsRes.error) {
      console.error('Error loading students for risk dashboard', studentsRes.error);
    }
    if (classesRes.error) {
      console.error('Error loading classes for risk dashboard', classesRes.error);
    }

    const classesById = new Map<
      string,
      { id: string; name: string | null; room: string | null }
    >();
    (classesRes.data ?? []).forEach((c: any) => {
      classesById.set(c.id, {
        id: c.id,
        name: c.name ?? null,
        room: c.room ?? null,
      });
    });

    const studentsById = new Map<
      string,
      { id: string; fullName: string; code: string | null; classId: string | null }
    >();
    (studentsRes.data ?? []).forEach((s: any) => {
      const fullName =
        [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unnamed student';
      studentsById.set(s.id, {
        id: s.id,
        fullName,
        code: s.code ?? null,
        classId: s.class_id ?? null,
      });
    });

    // 4) Aggregate per-student log counts
    const perStudentMap = new Map<string, number>();
    const perClassMap = new Map<string, number>();

    for (const log of logs) {
      if (log.student_id) {
        perStudentMap.set(
          log.student_id,
          (perStudentMap.get(log.student_id) ?? 0) + 1,
        );
      }
      if (log.class_id) {
        perClassMap.set(
          log.class_id,
          (perClassMap.get(log.class_id) ?? 0) + 1,
        );
      }
    }

    const perStudent: StudentRisk[] = Array.from(
      perStudentMap.entries(),
    ).map(([studentId, logCount]) => {
      const student = studentsById.get(studentId);
      const classMeta =
        student?.classId && classesById.has(student.classId)
          ? classesById.get(student.classId)
          : undefined;

      return {
        studentId,
        fullName: student?.fullName ?? 'Unknown student',
        code: student?.code ?? null,
        classId: student?.classId ?? null,
        className: classMeta?.name ?? null,
        classRoom: classMeta?.room ?? null,
        logCount,
      };
    }).sort((a, b) => b.logCount - a.logCount);

    const perClass: ClassRisk[] = Array.from(
      perClassMap.entries(),
    ).map(([classId, logCount]) => {
      const cls = classesById.get(classId);
      return {
        classId,
        className: cls?.name ?? 'Unknown class',
        classRoom: cls?.room ?? null,
        logCount,
      };
    }).sort((a, b) => b.logCount - a.logCount);

    // 5) Compute summary + risk buckets
    let low = 0;
    let medium = 0;
    let high = 0;

    for (const stu of perStudent) {
      if (stu.logCount >= 6) high += 1;
      else if (stu.logCount >= 3) medium += 1;
      else if (stu.logCount >= 1) low += 1;
    }

    const summary: RiskSummary = {
      totalLogs: logs.length,
      studentsWithLogs: perStudent.length,
      highRiskStudents: high,
      mediumRiskStudents: medium,
      lowRiskStudents: low,
    };

    return {
      summary,
      perStudent,
      perClass,
    };
  } catch (err) {
    console.error('Unexpected error loading risk data', err);
    return empty;
  }
}

type PageProps = {
  searchParams: Promise<{ range?: string | string[] }>;
};

export default async function RiskDashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawRange = Array.isArray(sp?.range) ? sp.range[0] : sp?.range;
  const rangeKey = normalizeRangeKey(rawRange);
  const { fromIso, label: rangeLabel } = getRangeInfo(rangeKey);

  const riskData = await getRiskData({ rangeKey, fromIso });
  const { summary, perStudent, perClass } = riskData;

  const topStudents = perStudent.slice(0, 5);
  const topClasses = perClass.slice(0, 5);

  return (
    <main className="space-y-6">
      {/* Header with Print button */}
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Risk dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Overview of behavior risk across students, classes, and rooms. Use
            the filters to change the date range, then print this view for
            meetings or documentation.
          </p>
        </div>

        <PrintButton label="Print risk report" />
      </header>

      {/* Range filters */}
      <section className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((opt) => {
            const isActive = opt.key === rangeKey;
            const href =
              opt.key === '30d' ? '/risk' : `/risk?range=${opt.key}`;

            const baseClasses =
              'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium';
            const activeClasses =
              'border-slate-900 bg-slate-900 text-white';
            const inactiveClasses =
              'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100';

            return (
              <Link
                key={opt.key}
                href={href}
                prefetch={false}
                className={`${baseClasses} ${
                  isActive ? activeClasses : inactiveClasses
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">
          Currently showing:{' '}
          <span className="font-medium">{rangeLabel}</span>
        </p>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total logs
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {summary.totalLogs}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            All recorded behavior logs in this range.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Students with logs
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {summary.studentsWithLogs}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Unique students with at least one incident.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Medium risk
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-900">
            {summary.mediumRiskStudents}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            3–5 logs in this range.
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">
            High risk
          </p>
          <p className="mt-2 text-2xl font-semibold text-red-900">
            {summary.highRiskStudents}
          </p>
          <p className="mt-1 text-xs text-red-700">
            6+ logs in this range.
          </p>
        </div>
      </section>

      {/* Top lists */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Top students */}
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Students with most logs
            </h2>
            <p className="text-xs text-slate-500">
              Sorted by log count (descending).
            </p>
          </div>

          {topStudents.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              No logs in this range.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {topStudents.map((s) => (
                <li
                  key={s.studentId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      <Link
                        href={`/students/${s.studentId}`}
                        className="hover:underline"
                      >
                        {s.fullName}
                      </Link>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {s.code ? `${s.code} • ` : ''}
                      {s.className ?? 'No class'}
                      {s.classRoom ? ` • Room ${s.classRoom}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                      {s.logCount} log{s.logCount === 1 ? '' : 's'}
                    </span>
                    <Link
                      href={`/students/${s.studentId}/report?range=${rangeKey}`}
                      className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
                    >
                      Report
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top classes */}
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Classes with most logs
            </h2>
            <p className="text-xs text-slate-500">
              Based on behavior logs for this range.
            </p>
          </div>

          {topClasses.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              No class-level logs in this range.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {topClasses.map((c) => (
                <li
                  key={c.classId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      <Link
                        href={`/classes/${c.classId}`}
                        className="hover:underline"
                      >
                        {c.className ?? 'Unknown class'}
                      </Link>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {c.classRoom ? `Room ${c.classRoom}` : 'No room'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-800">
                      {c.logCount} log{c.logCount === 1 ? '' : 's'}
                    </span>
                    <Link
                      href={`/logs?class_id=${c.classId}&range=${rangeKey}`}
                      className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
                    >
                      View logs
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

