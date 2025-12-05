// =========================================================
// src/app/students/[id]/report/page.tsx
// Student behavior report with parent-friendly summary
// =========================================================

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

export const dynamic = 'force-dynamic';

type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];
type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];

type RangeKey = '7d' | '30d' | '90d';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ range?: string }>;
};

function getRangeInfo(rangeParam?: string): {
  key: RangeKey;
  fromIso: string | null;
  label: string;
} {
  let key: RangeKey;

  if (rangeParam === '7d' || rangeParam === '90d') {
    key = rangeParam;
  } else {
    key = '30d';
  }

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  let fromIso: string | null = null;

  if (key === '7d') {
    fromIso = new Date(now.getTime() - 7 * msPerDay).toISOString();
  } else if (key === '30d') {
    fromIso = new Date(now.getTime() - 30 * msPerDay).toISOString();
  } else {
    fromIso = new Date(now.getTime() - 90 * msPerDay).toISOString();
  }

  const label =
    key === '7d' ? 'Last 7 days' : key === '30d' ? 'Last 30 days' : 'Last 90 days';

  return { key, fromIso, label };
}

function formatDateTime(value: string | null | undefined): string {
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

async function getStudentWithClass(
  id: string
): Promise<{ student: StudentRow | null; classRow: ClassRow | null }> {
  const supabaseAny = supabase as any;

  try {
    const { data, error } = await supabaseAny
      .from('students')
      .select(
        `
        id,
        first_name,
        last_name,
        code,
        is_live,
        class_id,
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

    const classesRel = (data as any).classes ?? null;

    return {
      student: data as StudentRow,
      classRow: classesRel as ClassRow | null,
    };
  } catch (err) {
    console.error('Unexpected error loading student for report', err);
    return { student: null, classRow: null };
  }
}

async function getLogsForStudent(
  studentId: string,
  fromIso: string | null
): Promise<BehaviorLogRow[]> {
  const supabaseAny = supabase as any;

  try {
    let query = supabaseAny
      .from('behavior_logs')
      .select('id, summary, level, occurred_at, student_id, class_id')
      .eq('student_id', studentId)
      .order('occurred_at', { ascending: false });

    if (fromIso) {
      query = query.gte('occurred_at', fromIso);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading logs for student report', error);
      return [];
    }

    return (data ?? []) as BehaviorLogRow[];
  } catch (err) {
    console.error('Unexpected error loading logs for student report', err);
    return [];
  }
}

export default async function StudentReportPage({
  params,
  searchParams,
}: PageProps) {
  // ✅ New Next 15 async dynamic APIs: await both
  const { id } = await params;
  const sp = (searchParams ? await searchParams : {}) ?? {};
  const rangeParam = sp.range;

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(rangeParam);

  const [{ student, classRow }, logs] = await Promise.all([
    getStudentWithClass(id),
    getLogsForStudent(id, fromIso),
  ]);

  if (!student) {
    return (
      <main className="space-y-4 p-4">
        <div className="text-xs text-slate-500">
          <Link href="/students" className="hover:underline">
            ← Back to students
          </Link>
        </div>
        <p className="text-sm text-slate-700">Student not found.</p>
      </main>
    );
  }

  const fullName =
    [student.first_name, student.last_name].filter(Boolean).join(' ') ||
    'Unnamed student';

  const totalLogs = logs.length;
  const positiveCount = logs.filter((l) => l.level === 'positive').length;
  const neutralCount = logs.filter((l) => l.level === 'neutral').length;
  const minorCount = logs.filter((l) => l.level === 'minor').length;
  const majorCount = logs.filter((l) => l.level === 'major').length;

  const rangePills: { key: RangeKey; label: string }[] = [
    { key: '7d', label: '7 days' },
    { key: '30d', label: '30 days' },
    { key: '90d', label: '90 days' },
  ];

  return (
    <main className="space-y-6 p-4 print-report">
      {/* Top nav / tip (hidden on print) */}
      <div className="flex items-center justify-between gap-2 no-print">
        <div className="text-xs text-slate-500">
          <Link href={`/students/${student.id}`} className="hover:underline">
            ← Back to student profile
          </Link>
        </div>
        <p className="text-[10px] text-slate-400">
          Tip: Use your browser&apos;s Print command (⌘P) to save this report as
          PDF.
        </p>
      </div>

      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Behavior report — {fullName}
        </h1>
        <p className="text-sm text-slate-600">
          Summary of logged behavior ({rangeLabel.toLowerCase()}).
        </p>
        <p className="text-xs text-slate-500">
          Student code:{' '}
          <span className="font-medium">{student.code ?? '—'}</span>
          {classRow ? (
            <>
              {' · '}Class:{' '}
              <span className="font-medium">{classRow.name ?? '—'}</span>
              {classRow.room ? (
                <>
                  {' · '}Room <span className="font-medium">{classRow.room}</span>
                </>
              ) : null}
            </>
          ) : null}
        </p>
      </header>

      {/* Parent-friendly summary card */}
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm print-report-card">
        <p className="font-medium text-slate-800">
          In {rangeLabel.toLowerCase()}, we recorded {totalLogs} behavior entr
          {totalLogs === 1 ? 'y' : 'ies'} for {fullName}.
        </p>
        <p className="mt-1 text-slate-700">
          Positive notes:{' '}
          <span className="font-semibold">{positiveCount}</span> · Neutral:{' '}
          <span className="font-semibold">{neutralCount}</span> · Minor concerns:{' '}
          <span className="font-semibold">{minorCount}</span> · Major concerns:{' '}
          <span className="font-semibold">{majorCount}</span>.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          This report supports home–school communication by highlighting strengths
          and patterns over time. It is not a formal disciplinary record.
        </p>
      </section>

      {/* Range pills (7 / 30 / 90 days) */}
      <section className="flex flex-wrap gap-2 text-xs no-print">
        {rangePills.map((pill) => {
          const isActive = pill.key === rangeKey;
          const href = `/students/${student.id}/report?range=${pill.key}`;
          return (
            <Link
              key={pill.key}
              href={href}
              className={
                'inline-flex items-center rounded-full border px-3 py-1 font-medium ' +
                (isActive
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100')
              }
            >
              {pill.label}
            </Link>
          );
        })}
      </section>

      {/* Detailed log list */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm print-report-card">
        <h2 className="text-sm font-semibold text-slate-800">Log entries</h2>

        {logs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No behavior logs recorded for this period.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 text-sm">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-2 py-2"
              >
                <div className="flex flex-col">
                  <p className="font-medium text-slate-900">
                    {(log as any).summary ?? 'No summary'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDateTime((log as any).occurred_at as string)}
                  </p>
                </div>
                <span className="mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-slate-700">
                  {((log as any).level as string) ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

