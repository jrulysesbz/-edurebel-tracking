// =========================================================
// src/app/students/[id]/page.tsx
// =========================================================

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';
import StudentRiskChips from '@/components/StudentRiskChips';

export const dynamic = 'force-dynamic';

type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Load a single student with their homeroom class attached.
 */
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
      console.error('Error loading student', error);
      return { student: null, classRow: null };
    }

    if (!data) {
      return { student: null, classRow: null };
    }

    const student = data as StudentRow;
    const classRow = (data as any).classes
      ? ((data as any).classes as ClassRow)
      : null;

    return { student, classRow };
  } catch (err) {
    console.error('Unexpected error loading student', err);
    return { student: null, classRow: null };
  }
}

export default async function StudentDetailPage(props: PageProps) {
  // ✅ Next.js 15 dynamic route API – params is async
  const { id } = await props.params;

  const { student, classRow } = await getStudentWithClass(id);

  if (!student) {
    return notFound();
  }

  const stu = student; // so we can use stu.id like you requested

  const fullName =
    [stu.first_name, stu.last_name].filter(Boolean).join(' ') ||
    'Unnamed student';

  const classLabel =
    classRow?.name && classRow?.room
      ? `${classRow.name} · Room ${classRow.room}`
      : classRow?.name || classRow?.room || 'No class assigned';

  const logsUrl = `/logs?student_id=${stu.id}&range=30d`;
  const newLogUrl = `/logs/new?student_id=${stu.id}&class_id=${
    stu.class_id ?? ''
  }`;
  const reportUrl = `/students/${stu.id}/report?range=30d`;

  return (
    <main className="space-y-6">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {fullName}
            </h1>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Code:</span>{' '}
              {stu.code ?? '—'} ·{' '}
              <span className="font-medium">Status:</span>{' '}
              {stu.is_live ? 'Active / Live' : 'Inactive'}
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-medium">Class:</span> {classLabel}
            </p>

            {/* 🔴 Risk chips directly under student meta */}
            <div className="mt-2">
              <StudentRiskChips studentId={stu.id} />
            </div>
          </div>

          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
            <Link
              href="/students"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Back to students
            </Link>
            <Link
              href={logsUrl}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              View logs (30d)
            </Link>
            <Link
              href={newLogUrl}
              className="inline-flex items-center rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              + New log
            </Link>
            <Link
              href={reportUrl}
              className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Printable report
            </Link>
          </div>
        </div>
      </header>

      {/* Simple summary panel – you can expand later */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700">
            Student info
          </h2>
          <dl className="mt-3 space-y-1 text-sm text-slate-700">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{fullName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Code</dt>
              <dd>{stu.code ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Status</dt>
              <dd>{stu.is_live ? 'Active / Live' : 'Inactive'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Class</dt>
              <dd>{classLabel}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold tracking-wide text-slate-700">
            Next actions
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>• Review the 30-day printable report for patterns.</li>
            <li>• Add a new log if anything notable happens today.</li>
            <li>• Use the Risk dashboard to compare this student to the class.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

