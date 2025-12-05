// =========================================================
// src/app/students/StudentsClient.tsx
// =========================================================

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Database } from '@/lib/supabase.types';
import type { StudentWithClass } from './page';

type ClassRow = Database['public']['Tables']['classes']['Row'];

type Props = {
  students: StudentWithClass[];
  classes: ClassRow[];
  search: string;
  selectedClassId: string;
  status: string;
};

export default function StudentsClient({
  students,
  classes,
  search,
  selectedClassId,
  status,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.push(`/students${qs ? `?${qs}` : ''}`);
  };

  const handleSearchChange = (value: string) => {
    updateParam('q', value);
  };

  const handleClassChange = (value: string) => {
    updateParam('class_id', value);
  };

  const handleStatusChange = (value: string) => {
    updateParam('status', value);
  };

  return (
    <main className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-sm text-slate-600">
          Quick view of students, their classes, and links to logs & reports.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            type="search"
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Name or code…"
            className="min-w-[160px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />

          <select
            value={selectedClassId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-40 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">All classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name ?? 'Unnamed class'}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-36 rounded-md border border-slate-300 px-2 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">All students</option>
            <option value="live">Live only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold">{students.length}</span>{' '}
          students
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Code
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Class
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Room
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => {
              const fullName = [s.first_name, s.last_name]
                .filter(Boolean)
                .join(' ');

              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 align-middle">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">
                        {fullName || 'Unnamed student'}
                      </span>
                      {s.is_live === false && (
                        <span className="mt-0.5 text-xs text-slate-500">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle text-slate-700">
                    {s.code ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-middle text-slate-700">
                    {s.class_name ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-middle text-slate-700">
                    {s.class_room ?? '—'}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/students/${s.id}`}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        View
                      </Link>
                      <Link
                        href={`/students/${s.id}/report`}
                        className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Report
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-sm text-slate-500"
                >
                  No students found. Try adjusting your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

