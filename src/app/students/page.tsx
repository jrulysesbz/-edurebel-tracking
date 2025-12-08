// =========================================================
// src/app/students/page.tsx
// =========================================================

// src/app/students/page.tsx
import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';

type StudentRow = Database['public']['Tables']['students']['Row'] & {
  classes?: {
    id: string;
    name: string | null;
    room: string | null;
  } | null;
};

export const dynamic = 'force-dynamic';

async function getStudents(): Promise<StudentRow[]> {
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
    `
    )
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error loading students', error);
    return [];
  }

  return (data ?? []) as StudentRow[];
}

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Students
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            View, import, and manage student records across classes and schools.
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <Link
            href="/logs"
            className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            View behavior logs
          </Link>
        </div>
      </header>

      {/* CSV Import panel */}
      <section className="no-print rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-700">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Import students from CSV
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              Upload a CSV exported from Excel/Sheets. Expected headers:{' '}
              <code className="font-mono text-[11px]">
                id, first_name, last_name, code, class_id, photo_url
              </code>
              . Rows with an existing <code>id</code> will be updated; others
              will be inserted.
            </p>
          </div>

          <form
            action="/api/student-import"
            method="post"
            encType="multipart/form-data"
            className="flex flex-col items-start gap-2 sm:flex-row sm:items-center"
          >
            <input
              required
              type="file"
              name="file"
              accept=".csv,text/csv"
              className="text-xs text-slate-700 file:mr-2 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-50"
            />
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Upload CSV
            </button>
          </form>
        </div>
      </section>

      {/* Students table */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Room</th>
              <th className="px-3 py-2">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-xs text-slate-500"
                >
                  No students found. Try importing a CSV or adding records in
                  Supabase.
                </td>
              </tr>
            )}

            {students.map((stu) => {
              const fullName =
                [stu.first_name, stu.last_name]
                  .filter(Boolean)
                  .join(' ') || 'Unnamed student';

              return (
                <tr
                  key={stu.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 overflow-hidden rounded-full bg-slate-200">
                        {stu.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={stu.photo_url}
                            alt={fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-500">
                            No photo
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">
                          {fullName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {stu.code ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {stu.classes?.name ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px] text-slate-700">
                    {stu.classes?.room ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-top text-[11px]">
                    <div className="flex flex-wrap gap-1">
                      <Link
                        href={`/students/${stu.id}`}
                        className="text-[11px] font-semibold text-slate-700 underline underline-offset-2"
                      >
                        View
                      </Link>
                      <span className="text-slate-400">·</span>
                      <Link
                        href={`/students/${stu.id}/report?range=30d`}
                        className="text-[11px] font-semibold text-slate-700 underline underline-offset-2"
                      >
                        Behavior report
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

