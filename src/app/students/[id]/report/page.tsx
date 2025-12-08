import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseServer';
import { getRangeInfo } from '@/lib/range';
import PrintButton from '@/components/PrintButton';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function StudentReportPage(props: PageProps) {
  // ✅ Next.js 15: params & searchParams are async
  const { id } = await props.params;
  const resolvedSearch = await props.searchParams;

  // ✅ Normalize range from URL (handles ?range=7d, &range=30d, etc.)
  const rangeParamRaw = resolvedSearch?.range;
  const rangeParam =
    Array.isArray(rangeParamRaw) && rangeParamRaw.length > 0
      ? rangeParamRaw[0]
      : rangeParamRaw;

  // ✅ Shared helper for range window
  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(rangeParam);

  // ✅ CSV export endpoint wired to same range
  const exportUrl = `/api/student-report-export?student_id=${encodeURIComponent(
    id,
  )}&range=${encodeURIComponent(rangeKey)}`;

  const supabaseAny = supabase as any;

  // 🔹 Load student + class
  const { data: student, error: studentError } = await supabaseAny
    .from('students')
    .select(
      `
      id,
      first_name,
      last_name,
      code,
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

  if (studentError || !student) {
    console.error('Error loading student for report', studentError);
    return notFound();
  }

  // 🔹 Load this student's logs in the selected range
  let logsQuery = supabaseAny
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
    `,
    )
    .eq('student_id', id)
    .order('created_at', { ascending: false });

  if (fromIso) {
    logsQuery = logsQuery.gte('created_at', fromIso);
  }

  const { data: logs, error: logsError } = await logsQuery;

  if (logsError) {
    console.error('Error loading behavior logs for student report', logsError);
  }

  const safeLogs = (logs ?? []) as any[];

  const fullName =
    [student.first_name, student.last_name].filter(Boolean).join(' ') ||
    'Unnamed student';

  const classLabel =
    student.classes?.name && student.classes?.room
      ? `${student.classes.name} · Room ${student.classes.room}`
      : student.classes?.name || student.classes?.room || '';

  return (
    <main className="space-y-6 p-6">
      {/* Header with range + actions */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Student behavior report
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Range: {rangeLabel}
          </p>
          <p className="text-sm text-slate-600">
            Timeline of logs, categories, and risk for this student. Use the
            range filter to control the window, then print or export for
            meetings, SSTs, and parent conferences.
          </p>
          <p className="text-xs text-slate-500">
            Student:{' '}
            <span className="font-semibold text-slate-800">{fullName}</span>
            {student.code && (
              <>
                {' · '}
                <span className="font-mono">{student.code}</span>
              </>
            )}
            {classLabel && (
              <>
                {' · '}Class: {classLabel}
              </>
            )}
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <PrintButton label="Print student report" />
          <a
            href={exportUrl}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Export CSV
          </a>
          <Link
            href={{
              pathname: '/logs',
              query: {
                range: rangeKey,
                student_id: id,
              },
            }}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            View in logs
          </Link>
        </div>
      </header>

      {/* Simple range chips (optional but nice) */}
      <section className="no-print flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
        <span className="font-semibold uppercase tracking-wide text-slate-500">
          Range
        </span>
        {[
          { key: '7d', label: 'Last 7 days' },
          { key: '30d', label: 'Last 30 days' },
          { key: '90d', label: 'Last 90 days' },
          { key: '12m', label: 'Last 12 months' },
        ].map((opt) => (
          <Link
            key={opt.key}
            href={{
              pathname: `/students/${id}/report`,
              query: { range: opt.key },
            }}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
              rangeKey === opt.key
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </section>

      {/* Logs table */}
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-2 py-1.5">Date / Time</th>
              <th className="px-2 py-1.5">Class</th>
              <th className="px-2 py-1.5">Room</th>
              <th className="px-2 py-1.5">Severity</th>
              <th className="px-2 py-1.5">Category</th>
              <th className="px-2 py-1.5">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {safeLogs.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-2 py-4 text-center text-[11px] text-slate-500"
                >
                  No logs found in this range for this student.
                </td>
              </tr>
            )}

            {safeLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-2 py-1.5 text-[11px] text-slate-600">
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString()
                    : ''}
                </td>
                <td className="px-2 py-1.5 text-[11px] text-slate-700">
                  {log.classes?.name || '—'}
                </td>
                <td className="px-2 py-1.5 text-[11px] text-slate-700">
                  {log.classes?.room || log.room || '—'}
                </td>
                <td className="px-2 py-1.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      log.severity === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : log.severity === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : log.severity === 'low'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {log.severity || 'n/a'}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-[11px] capitalize text-slate-700">
                  {log.category || 'other'}
                </td>
                <td className="max-w-xs px-2 py-1.5 text-[11px] text-slate-700">
                  {log.summary}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

