// =========================================================
// src/app/classes/page.tsx
// =========================================================

import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

export const dynamic = 'force-dynamic';

type ClassRow = Database['public']['Tables']['classes']['Row'];

async function getClasses(): Promise<ClassRow[]> {
  const supabaseAny = supabase as any;

  const { data, error } = await supabaseAny
    .from('classes')
    .select('id, name, room')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error loading classes', error);
    return [];
  }

  return (data ?? []) as ClassRow[];
}

export default async function ClassesPage() {
  const classes = await getClasses();

  return (
    <main className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Classes</h1>
        <p className="text-sm text-slate-600">
          Overview of classes / homerooms with quick links to details and
          reports.
        </p>
      </header>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
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
            {classes.map((cls) => (
              <tr key={cls.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 align-middle text-slate-900">
                  {cls.name ?? 'Unnamed class'}
                </td>
                <td className="px-3 py-2 align-middle text-slate-700">
                  {cls.room ?? '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-sm space-x-2">
                  <Link
                    href={`/classes/${cls.id}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    View
                  </Link>
                  <Link
                    href={`/classes/${cls.id}/report`}
                    className="inline-flex items-center rounded-full border border-slate-900 bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Report
                  </Link>
                </td>
              </tr>
            ))}

            {classes.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-8 text-center text-sm text-slate-500"
                >
                  No classes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

