// =========================================================
// src/app/students/[id]/page.tsx
// Student detail + quick links to logs & printable report
// =========================================================

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

export const dynamic = 'force-dynamic';

type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];
type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getStudent(id: string): Promise<StudentRow | null> {
  const supabaseAny = supabase as any;

  const { data, error } = await supabaseAny
    .from('students')
    .select('id, first_name, last_name, code, is_live, class_id, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error loading student', error);
    return null;
  }

  return (data as StudentRow) ?? null;
}

async function getClassForStudent(
  student: StudentRow | null,
): Promise<ClassRow | null> {
  if (!student?.class_id) return null;

  const supabaseAny = supabase as any;

  const { data, error } = await supabaseAny
    .from('classes')
    .select('id, name, room')
    .eq('id', student.class_id)
    .maybeSingle();

  if (error) {
    console.error('Error loading class for student', error);
    return null;
  }

  return (data as ClassRow) ?? null;
}

async function getRecentLogs(studentId: string): Promise<BehaviorLogRow[]> {
  const supabaseAny = supabase as any;

  const { data, error } = await supabaseAny
    .from('behavior_logs')
    .select('id, summary, level, occurred_at, class_id')
    .eq('student_id', studentId)
    .order('occurred_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error loading recent logs for student', error);
    return [];
  }

  return (data ?? []) as BehaviorLogRow[];
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

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const student = await getStudent(id);

  if (!student) {
    return (
      <main className="space-y-4">
        <div className="text-xs text-slate-500">
          <Link href="/students" className="hover:underline">
            ← Back to students
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Student not found
        </h1>
        <p className="text-sm text-slate-600">
          This student could not be loaded. They may have been removed.
        </p>
      </main>
    );
  }

  const [cls, recentLogs] = await Promise.all([
    getClassForStudent(student),
    getRecentLogs(student.id),
  ]);

  const fullName =
    [student.first_name, student.last_name].filter(Boolean).join(' ') ||
    'Unnamed student';

  const logsUrl = `/logs?student_id=${student.id}&range=30d`;
  const newLogUrl = `/logs/new?student_id=${student.id}&class_id=${student.class_id ?? ''}`;
  const reportUrl = `/students/${student.id}/report?range=30d`;

  return (
    <main className="space-y-6">
      {/* Back link */}
      <div className="text-xs text-slate-500">
        <Link href="/students" className="hover:underline">
          ← Back to students
        </Link>
      </div>

      {/* Header + quick actions */}
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
          <p className="text-sm text-slate-600">
            Code:{' '}
            <span className="font-medium">{student.code ?? '—'}</span>
            {' · '}
            Class:{' '}
            <span className="font-medium">
              {cls?.name ?? 'Unassigned'}
            </span>
            {cls?.room && (
              <>
                {' · '}
                Room:{' '}
                <span className="font-medium">{cls.room}</span>
              </>
            )}
          </p>
          <p className="text-xs text-slate-500">
            Status:{' '}
            <span className="font-medium">
              {student.is_live ? 'Active / live' : 'Inactive'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={logsUrl}
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
          >
            View logs (30d)
          </Link>
          <Link
            href={newLogUrl}
            className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800"
          >
            + New log
          </Link>
          <Link
            href={reportUrl}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-900 shadow-sm hover:bg-slate-50"
          >
            Printable report
          </Link>
        </div>
      </header>

      {/* Basic details card */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">
          Student details
        </h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Full name
            </dt>
            <dd className="mt-0.5 text-slate-900">{fullName}</dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Code
            </dt>
            <dd className="mt-0.5 text-slate-900">
              {student.code ?? '—'}
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Class
            </dt>
            <dd className="mt-0.5 text-slate-900">
              {cls?.name ?? 'Unassigned'}
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Room
            </dt>
            <dd className="mt-0.5 text-slate-900">
              {cls?.room ?? '—'}
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Live status
            </dt>
            <dd className="mt-0.5 text-slate-900">
              {student.is_live ? 'Active / live' : 'Inactive'}
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Created at
            </dt>
            <dd className="mt-0.5 text-slate-900">
              {formatDateTime(student.created_at as string)}
            </dd>
          </div>
        </dl>
      </section>

      {/* Recent logs */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Recent behavior logs
          </h2>
          <Link
            href={logsUrl}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            View all logs
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No behavior logs recorded yet for this student.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {recentLogs.map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-2 py-2"
              >
                <div className="flex flex-col">
                  <p className="font-medium text-slate-800">
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

