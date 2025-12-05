// =========================================================
// src/app/classes/[id]/page.tsx
// Class detail + quick links to logs & reports
// =========================================================

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

export const dynamic = 'force-dynamic';

type ClassRow = Database['public']['Tables']['classes']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getClass(id: string): Promise<ClassRow | null> {
  const supabaseAny = supabase as any;

  const { data, error } = await supabaseAny
    .from('classes')
    .select('id, name, room')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error loading class', error);
    return null;
  }

  return (data as ClassRow) ?? null;
}

async function getStudentsForClass(id: string): Promise<StudentRow[]> {
  const supabaseAny = supabase as any;

  const { data, error } = await supabaseAny
    .from('students')
    .select('id, first_name, last_name, code')
    .eq('class_id', id)
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error loading students for class', error);
    return [];
  }

  return (data ?? []) as StudentRow[];
}

export default async function ClassDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [cls, students] = await Promise.all([
    getClass(id),
    getStudentsForClass(id),
  ]);

  if (!cls) {
    return (
      <main className="space-y-4">
        <div className="text-xs text-slate-500">
          <Link href="/classes" className="hover:underline">
            ← Back to classes
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Class not found
        </h1>
        <p className="text-sm text-slate-600">
          This class could not be loaded. It may have been removed.
        </p>
      </main>
    );
  }

  const logsUrl = `/logs?class_id=${cls.id}&range=30d`;
  const newLogUrl = `/logs/new?class_id=${cls.id}`;
  const reportUrl = `/classes/${cls.id}/report?range=30d`;

  return (
    <main className="space-y-6">
      {/* Back link */}
      <div className="text-xs text-slate-500">
        <Link href="/classes" className="hover:underline">
          ← Back to classes
        </Link>
      </div>

      {/* Header + quick actions */}
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {cls.name ?? 'Unnamed class'}
          </h1>
          <p className="text-sm text-slate-600">
            Room:{' '}
            <span className="font-medium">{cls.room ?? '—'}</span>
            {' · '}
            Students:{' '}
            <span className="font-medium">{students.length}</span>
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
            Class report (printable)
          </Link>
        </div>
      </header>

      {/* Students table */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">
          Students in this class
        </h2>

        {students.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No students are currently assigned to this class.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Code
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const fullName =
                    [student.first_name, student.last_name]
                      .filter(Boolean)
                      .join(' ') || 'Unnamed student';

                  const studentLogsUrl = `/logs?student_id=${student.id}&range=30d`;
                  const studentNewLogUrl = `/logs/new?student_id=${student.id}&class_id=${cls.id}`;
                  const studentReportUrl = `/students/${student.id}/report?range=30d`;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 align-middle text-slate-900">
                        {fullName}
                      </td>
                      <td className="px-3 py-2 align-middle text-slate-700">
                        {student.code ?? '—'}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/students/${student.id}`}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            View
                          </Link>
                          <Link
                            href={studentLogsUrl}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Logs
                          </Link>
                          <Link
                            href={studentNewLogUrl}
                            className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            + Log
                          </Link>
                          <Link
                            href={studentReportUrl}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50"
                          >
                            Report
                          </Link>
                        </div>
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

