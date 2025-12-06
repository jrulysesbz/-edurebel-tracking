// =========================================================
// src/app/classes/[id]/page.tsx
// Class detail + 30d risk chip + quick links
// =========================================================

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

export const dynamic = 'force-dynamic';

type ClassRow = Database['public']['Tables']['classes']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];

type ClassWithMeta = {
  cls: ClassRow;
  studentCount: number;
};

type ClassRisk = {
  totalLogs30d: number;
  uniqueStudentsWithLogs: number;
};

type Severity = {
  label: string;
  className: string;
  description: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function getClassSeverity(count: number): Severity {
  if (count >= 12) {
    return {
      label: 'High risk',
      className: 'bg-rose-100 text-rose-800',
      description:
        'Many incidents in the last 30 days. This class may need targeted support or a plan.',
    };
  }
  if (count >= 6) {
    return {
      label: 'Medium risk',
      className: 'bg-amber-100 text-amber-800',
      description:
        'Several incidents in the last 30 days. Monitor climate and patterns closely.',
    };
  }
  if (count >= 1) {
    return {
      label: 'Watch',
      className: 'bg-sky-100 text-sky-800',
      description:
        'Some incidents recorded in the last 30 days. Worth keeping on your radar.',
    };
  }
  return {
    label: 'Calm',
    className: 'bg-emerald-100 text-emerald-800',
    description: 'No incidents logged for this class in the last 30 days.',
  };
}

async function getClassWithMeta(id: string): Promise<ClassWithMeta> {
  const supabaseAny = supabase as any;

  try {
    const { data: classData, error: classError } = await supabaseAny
      .from('classes')
      .select('id, name, room')
      .eq('id', id)
      .single();

    if (classError) {
      console.error('Error loading class detail', classError);
      throw new Error('Failed to load class');
    }

    const { data: students, error: studentsError } = await supabaseAny
      .from('students')
      .select('id')
      .eq('class_id', id);

    if (studentsError) {
      console.error('Error loading class students', studentsError);
    }

    const studentCount = (students ?? []) as Pick<StudentRow, 'id'>[];

    return {
      cls: classData as ClassRow,
      studentCount: studentCount.length,
    };
  } catch (err) {
    console.error('Unexpected error loading class with meta', err);
    throw err;
  }
}

async function getClassRisk(id: string): Promise<ClassRisk> {
  const supabaseAny = supabase as any;

  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromIso = from.toISOString();

  try {
    const { data, error } = await supabaseAny
      .from('behavior_logs')
      .select('id, created_at, student_id')
      .eq('class_id', id)
      .gte('created_at', fromIso);

    if (error) {
      console.error('Error loading class risk logs', error);
      return { totalLogs30d: 0, uniqueStudentsWithLogs: 0 };
    }

    const logs = (data ?? []) as Pick<
      BehaviorLogRow,
      'id' | 'created_at' | 'student_id'
    >[];

    const totalLogs30d = logs.length;
    const studentIds = new Set(
      logs
        .map((l) => l.student_id)
        .filter(
          (sid): sid is string => typeof sid === 'string' && Boolean(sid)
        )
    );

    return {
      totalLogs30d,
      uniqueStudentsWithLogs: studentIds.size,
    };
  } catch (err) {
    console.error('Unexpected error loading class risk logs', err);
    return { totalLogs30d: 0, uniqueStudentsWithLogs: 0 };
  }
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [{ cls, studentCount }, risk] = await Promise.all([
    getClassWithMeta(id),
    getClassRisk(id),
  ]);

  const severity = getClassSeverity(risk.totalLogs30d);

  const logsUrl = `/logs?class_id=${cls.id}&range=30d`;
  const reportUrl = `/classes/${cls.id}/report?range=30d`;

  return (
    <main className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {cls.name ?? 'Unnamed class'}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {cls.room && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                Room {cls.room}
              </span>
            )}

            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              {studentCount} student{studentCount === 1 ? '' : 's'}
            </span>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              {risk.uniqueStudentsWithLogs} student
              {risk.uniqueStudentsWithLogs === 1 ? '' : 's'} with logs / 30d
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${severity.className}`}
              title={severity.description}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {severity.label} · {risk.totalLogs30d} log
              {risk.totalLogs30d === 1 ? '' : 's'} / 30d
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/classes"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to classes
          </Link>
          <Link
            href={logsUrl}
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            View logs (30d)
          </Link>
          <Link
            href={reportUrl}
            className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            Class report (30d)
          </Link>
        </div>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Snapshot
        </p>
        <p className="mt-2 text-sm">
          This view summarizes how many incidents were logged for this class in
          the last 30 days and how many unique students were involved. Use it
          together with the class report to plan interventions and support.
        </p>
      </section>
    </main>
  );
}

