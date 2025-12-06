import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';
import PrintButton from '@/components/PrintButton';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type RangeKey = '7d' | '30d' | '90d' | '12m';

type SeverityFilter = 'high' | 'medium' | 'low' | null;
type CategoryFilter = 'disruption' | 'work' | 'respect' | 'safety' | 'other' | null;

type RiskLogBase = Database['public']['Tables']['behavior_logs']['Row'];

type RiskLog = RiskLogBase & {
  students: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    code: string | null;
  } | null;
  classes: {
    id: string;
    name: string | null;
    room: string | null;
  } | null;
};

type RiskSummary = {
  totalLogs: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  studentCount: number;
  classCount: number;
  roomCount: number;
};

type RiskByStudent = {
  student_id: string;
  student_name: string;
  student_code: string;
  total_logs: number;
  high: number;
  medium: number;
  low: number;
  risk_score: number;
};

type RiskByClass = {
  class_id: string;
  class_name: string;
  room_name: string;
  total_logs: number;
  high: number;
  medium: number;
  low: number;
  risk_score: number;
};

type RiskByRoom = {
  room_name: string;
  total_logs: number;
  high: number;
  medium: number;
  low: number;
  risk_score: number;
};

type RiskData = {
  logs: RiskLog[];
  summary: RiskSummary;
  byStudent: RiskByStudent[];
  byClass: RiskByClass[];
  byRoom: RiskByRoom[];
};

function getRangeInfo(param?: string): { key: RangeKey; fromIso: string | null; label: string } {
  const now = new Date();
  let key: RangeKey = '30d';

  if (param === '7d' || param === '90d' || param === '12m') {
    key = param;
  }

  const d = new Date(now);
  let label = '';

  switch (key) {
    case '7d':
      d.setDate(d.getDate() - 7);
      label = 'Last 7 days';
      break;
    case '30d':
      d.setDate(d.getDate() - 30);
      label = 'Last 30 days';
      break;
    case '90d':
      d.setDate(d.getDate() - 90);
      label = 'Last 90 days';
      break;
    case '12m':
      d.setMonth(d.getMonth() - 12);
      label = 'Last 12 months';
      break;
  }

  return {
    key,
    fromIso: d.toISOString(),
    label,
  };
}

function normalizeSeverity(param: string | undefined): SeverityFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return null;
}

function normalizeCategory(param: string | undefined): CategoryFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (v === 'disruption' || v === 'work' || v === 'respect' || v === 'safety' || v === 'other') {
    return v;
  }
  return null;
}

async function getRiskData(
  rangeKey: RangeKey,
  fromIso: string | null,
  severity: SeverityFilter,
  category: CategoryFilter,
): Promise<RiskData> {
  const supabaseAny = supabase as any;

  try {
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
      );

    if (fromIso) {
      logsQuery = logsQuery.gte('created_at', fromIso);
    }

    if (severity) {
      logsQuery = logsQuery.eq('severity', severity);
    }

    if (category) {
      logsQuery = logsQuery.eq('category', category);
    }

    const { data, error } = await logsQuery.order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading risk data', error);
      return {
        logs: [],
        summary: {
          totalLogs: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          studentCount: 0,
          classCount: 0,
          roomCount: 0,
        },
        byStudent: [],
        byClass: [],
        byRoom: [],
      };
    }

    const logs = (data || []) as RiskLog[];

    const totalLogs = logs.length;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    const byStudentMap = new Map<string, RiskByStudent>();
    const byClassMap = new Map<string, RiskByClass>();
    const byRoomMap = new Map<string, RiskByRoom>();

    const sevWeight: Record<'high' | 'medium' | 'low', number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    for (const log of logs) {
      const sevRaw = (log.severity ?? 'low').toLowerCase();
      const sev = (sevRaw === 'high' || sevRaw === 'medium' || sevRaw === 'low'
        ? sevRaw
        : 'low') as 'high' | 'medium' | 'low';

      if (sev === 'high') highCount++;
      else if (sev === 'medium') mediumCount++;
      else lowCount++;

      const score = sevWeight[sev];

      // Student aggregate
      if (log.student_id) {
        const id = log.student_id;
        const nameParts = [
          log.students?.first_name ?? '',
          log.students?.last_name ?? '',
        ].filter(Boolean);
        const name = nameParts.join(' ') || 'Unknown student';
        const code = log.students?.code ?? '';

        let entry = byStudentMap.get(id);
        if (!entry) {
          entry = {
            student_id: id,
            student_name: name,
            student_code: code,
            total_logs: 0,
            high: 0,
            medium: 0,
            low: 0,
            risk_score: 0,
          };
          byStudentMap.set(id, entry);
        }
        entry.total_logs += 1;
        entry[sev] += 1;
        entry.risk_score += score;
      }

      // Class aggregate
      if (log.class_id) {
        const id = log.class_id;
        const className = log.classes?.name ?? 'Unknown class';
        const roomName = log.classes?.room ?? log.room ?? 'Unknown room';

        let entry = byClassMap.get(id);
        if (!entry) {
          entry = {
            class_id: id,
            class_name: className,
            room_name: roomName,
            total_logs: 0,
            high: 0,
            medium: 0,
            low: 0,
            risk_score: 0,
          };
          byClassMap.set(id, entry);
        }
        entry.total_logs += 1;
        entry[sev] += 1;
        entry.risk_score += score;
      }

      // Room aggregate
      const roomName = log.classes?.room ?? log.room ?? 'Unknown room';
      let roomEntry = byRoomMap.get(roomName);
      if (!roomEntry) {
        roomEntry = {
          room_name: roomName,
          total_logs: 0,
          high: 0,
          medium: 0,
          low: 0,
          risk_score: 0,
        };
        byRoomMap.set(roomName, roomEntry);
      }
      roomEntry.total_logs += 1;
      roomEntry[sev] += 1;
      roomEntry.risk_score += score;
    }

    const byStudent = Array.from(byStudentMap.values()).sort(
      (a, b) => b.risk_score - a.risk_score || b.total_logs - a.total_logs,
    );
    const byClass = Array.from(byClassMap.values()).sort(
      (a, b) => b.risk_score - a.risk_score || b.total_logs - a.total_logs,
    );
    const byRoom = Array.from(byRoomMap.values()).sort(
      (a, b) => b.risk_score - a.risk_score || b.total_logs - a.total_logs,
    );

    const summary: RiskSummary = {
      totalLogs,
      highCount,
      mediumCount,
      lowCount,
      studentCount: byStudentMap.size,
      classCount: byClassMap.size,
      roomCount: byRoomMap.size,
    };

    return {
      logs,
      summary,
      byStudent,
      byClass,
      byRoom,
    };
  } catch (err) {
    console.error('Unexpected error loading risk data', err);
    return {
      logs: [],
      summary: {
        totalLogs: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        studentCount: 0,
        classCount: 0,
        roomCount: 0,
      },
      byStudent: [],
      byClass: [],
      byRoom: [],
    };
  }
}

export default async function RiskDashboardPage({ searchParams }: PageProps) {
  const resolvedSearch = (await searchParams) ?? {};

  const rangeParamRaw = resolvedSearch.range;
  const rangeParam =
    Array.isArray(rangeParamRaw) && rangeParamRaw.length > 0
      ? rangeParamRaw[0]
      : rangeParamRaw;

  const severityParamRaw = resolvedSearch.severity;
  const severityParam =
    Array.isArray(severityParamRaw) && severityParamRaw.length > 0
      ? severityParamRaw[0]
      : severityParamRaw;

  const categoryParamRaw = resolvedSearch.category;
  const categoryParam =
    Array.isArray(categoryParamRaw) && categoryParamRaw.length > 0
      ? categoryParamRaw[0]
      : categoryParamRaw;

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(
    typeof rangeParam === 'string' ? rangeParam : undefined,
  );
  const severityFilter = normalizeSeverity(
    typeof severityParam === 'string' ? severityParam : undefined,
  );
  const categoryFilter = normalizeCategory(
    typeof categoryParam === 'string' ? categoryParam : undefined,
  );

  const riskData = await getRiskData(rangeKey, fromIso, severityFilter, categoryFilter);

  const exportUrl = `/api/risk-export?range=${encodeURIComponent(
    rangeKey,
  )}${severityFilter ? `&severity=${encodeURIComponent(severityFilter)}` : ''}${
    categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''
  }`;

  return (
    <main className="space-y-6">
      {/* Header with print + CSV */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Risk dashboard</h1>
          <p className="text-xs font-medium text-slate-500">Range: {rangeLabel}</p>
          <p className="text-sm text-slate-600">
            Overview of behavior risk across students, classes, and rooms. Use the filters
            to change the date range, then print or export this view for meetings,
            parent conferences, or documentation.
          </p>
        </div>

        <div className="no-print flex items-center gap-2">
          <PrintButton label="Print risk report" />
          <a
            href={exportUrl}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Export CSV
          </a>
        </div>
      </header>

      {/* Legend / help text */}
      <section className="no-print rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
        <p className="font-semibold text-slate-700">How to read this page</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>
            <span className="font-semibold">Range</span> controls the time window (7d,
            30d, 90d, 12m). All counts, scores, and exports respect this.
          </li>
          <li>
            <span className="font-semibold">Severity</span>:{' '}
            <span className="ml-1 font-medium text-emerald-700">Low</span> = minor
            reminders,{' '}
            <span className="font-medium text-amber-700">Medium</span> = repeated or
            disruptive,{' '}
            <span className="font-medium text-rose-700">High</span> = serious safety or
            pattern concerns.
          </li>
          <li>
            <span className="font-semibold">Category</span> focuses the view on
            disruption, work habits, respect, safety, or other notes.
          </li>
          <li>
            Use <span className="font-semibold">Print</span> for PDF handouts and{' '}
            <span className="font-semibold">Export CSV</span> for deeper analysis or
            sharing with teams.
          </li>
        </ul>
      </section>

      {/* Filters toolbar: range + severity + category */}
      <section className="no-print flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Range filter */}
        <div className="flex flex-wrap items-center gap-2">
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
                pathname: '/risk',
                query: {
                  range: opt.key,
                  ...(severityFilter ? { severity: severityFilter } : {}),
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                },
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
        </div>

        {/* Severity filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            Severity
          </span>
          {[
            { key: null as SeverityFilter, label: 'All' },
            { key: 'high' as const, label: 'High' },
            { key: 'medium' as const, label: 'Medium' },
            { key: 'low' as const, label: 'Low' },
          ].map((opt) => (
            <Link
              key={opt.label}
              href={{
                pathname: '/risk',
                query: {
                  range: rangeKey,
                  ...(opt.key ? { severity: opt.key } : {}),
                  ...(categoryFilter ? { category: categoryFilter } : {}),
                },
              }}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                severityFilter === opt.key
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            Category
          </span>
          {[
            { key: null as CategoryFilter, label: 'All' },
            { key: 'disruption' as const, label: 'Disruption' },
            { key: 'work' as const, label: 'Work' },
            { key: 'respect' as const, label: 'Respect' },
            { key: 'safety' as const, label: 'Safety' },
            { key: 'other' as const, label: 'Other' },
          ].map((opt) => (
            <Link
              key={opt.label}
              href={{
                pathname: '/risk',
                query: {
                  range: rangeKey,
                  ...(severityFilter ? { severity: severityFilter } : {}),
                  ...(opt.key ? { category: opt.key } : {}),
                },
              }}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                categoryFilter === opt.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total logs
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {riskData.summary.totalLogs}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            All recorded behavior logs in this window.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            High severity
          </p>
          <p className="mt-2 text-2xl font-semibold text-rose-700">
            {riskData.summary.highCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Serious or repeated behaviors needing close follow-up.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Students involved
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {riskData.summary.studentCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Unique students with at least one log in this window.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Classes / rooms
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {riskData.summary.classCount} / {riskData.summary.roomCount}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Where behavior is happening most frequently.
          </p>
        </div>
      </section>

      {/* Hotspot panels */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Top classes by risk */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Top classes by risk</h2>
          <p className="mt-1 text-xs text-slate-500">
            Highest combined risk scores in the selected range.
          </p>
          <ol className="mt-3 space-y-2 text-xs">
            {riskData.byClass.slice(0, 5).map((cls, idx) => (
              <li
                key={cls.class_id}
                className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{cls.class_name}</p>
                    <p className="text-[11px] text-slate-500">
                      {cls.total_logs} logs · score {cls.risk_score}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/classes/${cls.class_id}/report?range=${rangeKey}`}
                  className="text-[11px] font-semibold text-slate-700 underline underline-offset-2"
                >
                  View report
                </Link>
              </li>
            ))}
            {riskData.byClass.length === 0 && (
              <li className="text-[11px] text-slate-500">No class data in this range.</li>
            )}
          </ol>
        </div>

        {/* Top rooms by risk */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Top rooms by risk</h2>
          <p className="mt-1 text-xs text-slate-500">
            Rooms with the most frequent or severe behavior in this window.
          </p>
          <ol className="mt-3 space-y-2 text-xs">
            {riskData.byRoom.slice(0, 5).map((room, idx) => (
              <li
                key={room.room_name || idx}
                className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-500">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">
                      {room.room_name || 'Unknown room'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {room.total_logs} logs · score {room.risk_score}
                    </p>
                  </div>
                </div>
              </li>
            ))}
            {riskData.byRoom.length === 0 && (
              <li className="text-[11px] text-slate-500">No room data in this range.</li>
            )}
          </ol>
        </div>
      </section>

      {/* Recent logs table */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Recent logs</h2>
        <p className="mt-1 text-xs text-slate-500">
          Latest behavior logs in this window. Use student or class reports for deeper
          drill-down.
        </p>

        {riskData.logs.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">
            No behavior logs found for this range and filter combination.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-2 py-1 text-left font-semibold text-slate-600">
                    Date / Time
                  </th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-600">
                    Student
                  </th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-600">
                    Class / Room
                  </th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-600">
                    Severity
                  </th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-600">
                    Category
                  </th>
                  <th className="px-2 py-1 text-left font-semibold text-slate-600">
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody>
                {riskData.logs.slice(0, 200).map((log) => {
                  const created = new Date(log.created_at);
                  const dateStr = created.toLocaleDateString('en-CA'); // YYYY-MM-DD
                  const timeStr = created.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const studentName =
                    (log.students?.first_name || log.students?.last_name) ??
                    'Unknown student';
                  const studentFullName = [log.students?.first_name, log.students?.last_name]
                    .filter(Boolean)
                    .join(' ') || studentName;
                  const studentCode = log.students?.code;

                  const className = log.classes?.name ?? '—';
                  const roomName = log.classes?.room ?? log.room ?? '—';

                  const sev = (log.severity ?? '').toLowerCase();
                  let sevBadge = 'bg-slate-100 text-slate-700';
                  if (sev === 'high') sevBadge = 'bg-rose-100 text-rose-700';
                  else if (sev === 'medium') sevBadge = 'bg-amber-100 text-amber-700';
                  else if (sev === 'low') sevBadge = 'bg-emerald-100 text-emerald-700';

                  return (
                    <tr key={log.id} className="border-b border-slate-100">
                      <td className="px-2 py-1 align-top text-slate-700">
                        <div>{dateStr}</div>
                        <div className="text-[11px] text-slate-500">{timeStr}</div>
                      </td>
                      <td className="px-2 py-1 align-top text-slate-700">
                        <div>{studentFullName}</div>
                        {studentCode && (
                          <div className="text-[11px] text-slate-500">{studentCode}</div>
                        )}
                      </td>
                      <td className="px-2 py-1 align-top text-slate-700">
                        <div>{className}</div>
                        <div className="text-[11px] text-slate-500">{roomName}</div>
                      </td>
                      <td className="px-2 py-1 align-top">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${sevBadge}`}>
                          {log.severity ?? '—'}
                        </span>
                      </td>
                      <td className="px-2 py-1 align-top text-slate-700">
                        {log.category ?? '—'}
                      </td>
                      <td className="px-2 py-1 align-top text-slate-700">
                        {log.summary ?? '—'}
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

