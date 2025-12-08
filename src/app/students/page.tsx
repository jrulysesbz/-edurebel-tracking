// =========================================================
// src/app/students/page.tsx
// =========================================================

import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';
import StudentRiskChips from '@/components/StudentRiskChips';

type StudentRow = Database['public']['Tables']['students']['Row'] & {
  classes?: {
    id: string;
    name: string | null;
    room: string | null;
  } | null;
};

export default async function StudentsPage() {
  const supabaseAny = supabase as any;

  const { data, error } = await supabaseAny
    .from('students')
    .select(
      `
      id,
      first_name,
      last_name,
      code,
      photo_url,
      classes:class_id (
        id,
        name,
        room
      )
    `,
    )
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error loading students', error);
  }

  const students: StudentRow[] = data ?? [];

  return (
    <main className="space-y-6 p-6">
      {/* Page header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Students
          </h1>
          <p className="text-sm text-slate-600">
            Browse students, open individual reports, and review behavior risk
            patterns for your classes.
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            ← Back to dashboard
          </Link>
        </div>
      </header>

      {/* CSV import toolbar */}
      <section className="no-print flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Import students
          </p>
          <p className="text-[11px] text-slate-600">
            Upload a CSV with columns like{' '}
            <span className="font-mono">
              first_name,last_name,code,class_id,photo_url
            </span>
            . Existing IDs will be updated; new rows will be created.
          </p>
        </div>

        <form
          action="/api/student-import"
          method="POST"
          encType="multipart/form-data"
          className="flex flex-wrap items-center gap-2 text-xs"
        >
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block w-48 cursor-pointer text-[11px] text-slate-700 file:mr-2 file:cursor-pointer file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-[11px] file:font-semibold file:text-slate-700 hover:file:bg-slate-50"
          />
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Import CSV
          </button>
        </form>
      </section>

      {/* Students table */}
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Room</th>
              <th className="px-3 py-2">Risk (30d)</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-xs text-slate-500"
                >
                  No students found. Try importing a CSV or check your filters.
                </td>
              </tr>
            )}

            {students.map((stu) => {
              const fullName =
                [stu.first_name, stu.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Unnamed student';

              return (
                <tr key={stu.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200">
                        {stu.photo_url ? (
                          <img
                            src={stu.photo_url}
                            alt={`Photo of ${fullName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-500">
                            No photo
                          </div>
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/students/${stu.id}`}
                          className="text-xs font-semibold text-slate-900 underline underline-offset-2"
                        >
                          {fullName}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {stu.code ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {stu.classes?.name || 'No class'}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {stu.classes?.room || '—'}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px]">
                    <StudentRiskChips studentId={stu.id} />
                  </td>
                  <td className="px-3 py-2 align-top text-[11px]">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/students/${stu.id}/report?range=30d`}
                        className="text-[11px] font-semibold text-slate-700 underline underline-offset-2"
                      >
                        Behavior report
                      </Link>
                      <Link
                        href={{
                          pathname: '/logs',
                          query: { student_id: stu.id, range: '30d' },
                        }}
                        className="text-[11px] font-semibold text-slate-700 underline underline-offset-2"
                      >
                        View logs
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}

