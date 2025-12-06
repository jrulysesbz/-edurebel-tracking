// =========================================================
// src/app/classes/[id]/report/page.tsx
// Class behavior report (server component, no client handlers)
// =========================================================

import Link from 'next/link';
import PrintButton from '@/components/PrintButton';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';

type ClassRow = Database['public']['Tables']['classes']['Row'];
type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];

type RangeKey = '7d' | '30d' | '90d' | '12m';

function getRangeInfo(rangeParamRaw: string | undefined): {
  key: RangeKey;
  fromIso: string;
  label: string;
} {
  const now = new Date();
  let key: RangeKey;

  if (rangeParamRaw === '7d' || rangeParamRaw === '90d' || rangeParamRaw === '12m') {
    key = rangeParamRaw;
  } else {
    key = '30d';
  }

  const from = new Date(now);

  switch (key) {
    case '7d':
      from.setDate(now.getDate() - 7);
      break;
    case '90d':
      from.setDate(now.getDate() - 90);
      break;
    case '12m':
      from.setMonth(now.getMonth() - 12);
      break;
    case '30d':
    default:
      from.setDate(now.getDate() - 30);
      break;
  }

  let label = 'Last 30 days';
  if (key === '7d') label = 'Last 7 days';
  if (key === '90d') label = 'Last 90 days';
  if (key === '12m') label = 'Last 12 months';

  return {
    key,
    fromIso: from.toISOString(),
    label,
  };
}

async function getClassRow(classId: string): Promise<ClassRow | null> {
  const supabaseAny = supabase as any;

  const { data, error } = await supabaseAny
    .from('classes')
    .select('id, name, room')
    .eq('id', classId)
    .maybeSingle();

  if (error) {
    console.error('Error loading class for report', error);
    return null;
  }

  return (data ?? null) as ClassRow | null;
}

async function getClassLogs(
  classId: string,
  fromIso: string
): Promise<BehaviorLogRow[]> {
  const supabaseAny = supabase as any;

  try {
    let query = supabaseAny
      .from('behavior_logs')
      .select(
        `
        id,
        created_at,
        student_id,
        class_id,
        room,
        category,
        severity,
        summary,
        students:student_id (
          id,
          first_name,
          last_name,
          code
        ),
        classes:class_id (
          id,
          name,
          room
        )
      `
      )
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (fromIso) {
      query = query.gte('created_at', fromIso);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading behavior logs for class report', error);
      return [];
    }

    return (data ?? []) as BehaviorLogRow[];
  } catch (err) {
    console.error('Unexpected error loading class logs', err);
    return [];
  }
}

export const dynamic = 'force-dynamic';

export default async function ClassReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const rangeParamRaw = sp.range;
  const rangeParam =
    Array.isArray(rangeParamRaw) && rangeParamRaw.length > 0
      ? rangeParamRaw[0]
      : rangeParamRaw;

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(
    rangeParam ?? undefined
  );
  const exportUrl = `/api/class-report-export?class_id=${encodeURIComponent(
    id
  )}&range=${encodeURIComponent(rangeKey)}`;

  const [classRow, logs] = await Promise.all([
    getClassRow(id),
    getClassLogs(id, fromIso),
  ]);

  if (!classRow) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-red-700">
          Class not found
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We couldn&apos;t find that class record. Please go back to the Classes
          list and try again.
        </p>
        <div className="mt-4">
          <Link
            href="/classes"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Classes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 print:px-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Class behavior report
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Range: {rangeLabel}
          </p>
          <p className="text-sm text-slate-600">
            Timeline of logs, categories, and risk for this class. Use the range
            filter to control the window, then print or export for team meetings,
            SSTs, and parent conferences.
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <PrintButton label="Print class report" />
          <a
            href={exportUrl}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Export CSV
          </a>
        </div>
      </header>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm print:border-none print:bg-transparent">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Class
            </p>
            <p className="text-base font-semibold text-slate-900">
              {classRow.name ?? 'Unnamed class'}
            </p>
          </div>
          <div className="no-print">
            <Link
              href={`/classes/${classRow.id}`}
              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              View class page
            </Link>
          </div>
        </div>

        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Room
            </p>
            <p className="text-sm text-slate-800">
              {classRow.room ? `Room ${classRow.room}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Logs in range
            </p>
            <p className="text-sm text-slate-800">
              {logs.length} log{logs.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">
          Class behavior timeline
        </h2>

        {logs.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            No behavior logs found for this class in the selected range.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white print:border print:border-slate-300">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 print:bg-slate-100">
                <tr>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Date / Time
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Student
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Room
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Category
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Severity
                  </th>
                  <th className="px-3 py-2 font-semibold text-slate-600">
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const created =
                    typeof log.created_at === 'string'
                      ? new Date(log.created_at)
                      : new Date(String(log.created_at));

                  const dateStr = created.toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const anyLog: any = log;
                  const stu = anyLog.students as
                    | (StudentRow & { code?: string | null })
                    | undefined;

                  const studentName = stu
                    ? `${stu.first_name ?? ''} ${stu.last_name ?? ''}`.trim()
                    : '—';
                  const studentCode = stu?.code ?? null;

                  const room =
                    anyLog.room ??
                    anyLog.classes?.room ??
                    classRow.room ??
                    '—';

                  return (
                    <tr key={log.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 align-top text-slate-700">
                        {dateStr}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        <div>{studentName || '—'}</div>
                        {studentCode ? (
                          <div className="text-[11px] text-slate-500">
                            ({studentCode})
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        Room {room}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {(anyLog.category as string) || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {(anyLog.severity as string) || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {anyLog.summary ?? '—'}
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

