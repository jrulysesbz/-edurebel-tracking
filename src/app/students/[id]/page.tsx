// =========================================================
// src/app/students/[id]/page.tsx
// =========================================================

import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';
import StudentRiskChips from '@/components/StudentRiskChips';
import StudentPhotoUploader from '@/components/StudentPhotoUploader';

type PageProps = {
  // ✅ Next.js 15 dynamic route API – params is async
  params: Promise<{ id: string }>;
};

export default async function StudentPage(props: PageProps) {
  const { id } = await props.params;

  const supabaseAny = supabase as any;

  const { data: student, error } = await supabaseAny
    .from('students')
    .select(
      `
      id,
      first_name,
      last_name,
      code,
      photo_url,
      class_id,
      classes:class_id (
        id,
        name,
        room
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error || !student) {
    console.error('Error loading student', error);
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Student not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We couldn&apos;t load this student record.
        </p>
        <Link
          href="/students"
          className="mt-4 inline-flex text-sm font-semibold text-slate-700 underline underline-offset-2"
        >
          ← Back to students
        </Link>
      </main>
    );
  }

  const fullName =
    [student.first_name, student.last_name].filter(Boolean).join(' ') ||
    'Unnamed student';

  const classLabel =
    student.classes?.name && student.classes?.room
      ? `${student.classes.name} · Room ${student.classes.room}`
      : student.classes?.name || student.classes?.room || 'No class assigned';

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {/* Avatar + upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-200">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={`Photo of ${fullName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-500">
                  No photo
                </div>
              )}
            </div>
            <StudentPhotoUploader studentId={student.id} />
          </div>

          {/* Name + meta */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {fullName}
            </h1>

            <p className="text-sm text-slate-600">
              <span className="font-medium">Code:</span>{' '}
              {student.code ?? '—'}
            </p>

            <p className="text-sm text-slate-600">
              <span className="font-medium">Class:</span>{' '}
              {student.classes ? (
                <Link
                  href={`/classes/${student.classes.id}`}
                  className="font-medium text-slate-800 underline underline-offset-2"
                >
                  {classLabel}
                </Link>
              ) : (
                classLabel
              )}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={`/students/${student.id}/report?range=30d`}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                View behavior report (30d)
              </Link>
              <Link
                href={{
                  pathname: '/logs',
                  query: { student_id: student.id, range: '30d' },
                }}
                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                View logs
              </Link>
              <Link
                href="/students"
                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                ← Back to students
              </Link>
            </div>
          </div>
        </div>

        {/* Risk chips on the right */}
        <div className="no-print">
          <StudentRiskChips studentId={student.id} />
        </div>
      </header>

      {/* Add more sections here later: attendance, notes, etc. */}
    </main>
  );
}

