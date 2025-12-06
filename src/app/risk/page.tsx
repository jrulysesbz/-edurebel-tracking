// src/app/risk/page.tsx

import Link from 'next/link';
import { supabase } from '@/lib/supabaseServer';
import PrintButton from '@/components/PrintButton';
import RiskOverviewPanel from '@/components/RiskOverviewPanel';

export const dynamic = 'force-dynamic';

type RangeKey = '7d' | '30d' | '90d' | '365d';

type RiskLog = {
  id: string;
  created_at: string;
  severity: string | null;
  summary: string | null;
  student_name: string;
  student_code: string | null;
  class_name: string | null;
  room_name: string | null;
};

export type RiskData = {
  totalLogs: number;
  severeCount: number;
  moderateCount: number;
  lowCount: number;
  studentsAtRisk: number;
  classesAtRisk: number;
  roomsAtRisk: number;
  latestLogs: RiskLog[];
};

function getEmptyRiskData(): RiskData {
  return {
    totalLogs: 0,
    severeCount: 0,
    moderateCount: 0,
    lowCount: 0,
    studentsAtRisk: 0,
    classesAtRisk: 0,
    roomsAtRisk: 0,
    latestLogs: [],
  };
}

function getRangeInfo(
  rangeParam: string | null | undefined
): { key: RangeKey; fromIso: string | null; label: string } {
  const now = new Date();

  let key: RangeKey = '30d';
  let days = 30;
  let label = 'Last 30 days';

  switch (rangeParam) {
    case '7d':
      key = '7d';
      days = 7;
      label = 'Last 7 days';
      break;
    case '30d':
      key = '30d';
      days = 30;
      label = 'Last 30 days';
      break;
    case '90d':
      key = '90d';
      days = 90;
      label = 'Last 90 days';
      break;
    case '365d':
      key = '365d';
      days = 365;
      label = 'Last 12 months';
      break;
    default:
      key = '30d';
      days = 30;
      label = 'Last 30 days';
  }

  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    key,
    fromIso: from.toISOString(),
    label,
  };
}

async function getRiskData(
  rangeKey: RangeKey,
  fromIso: string | null
): Promise<RiskData> {
  const supabaseAny = supabase as any;

  if (!supabaseAny || typeof supabaseAny.from !== 'function') {
    console.error(
      'Supabase server client is not configured correctly in supabaseServer.ts'
    );
    return getEmptyRiskData();
  }

  try {
    let logsQuery = supabaseAny
      .from('behavior_logs')
      .select(
        `
        id,
        created_at,
        severity,
        summary,
        student:student_id (
          id,
          first_name,
          last_name,
          code
        ),
        class:class_id (
          id,
          name
        ),
        room
      `
      )
      .order('created_at', { ascending: false });

    if (fromIso) {
      logsQuery = logsQuery.gte('created_at', fromIso);
    }

    const { data, error } = await logsQuery;

    if (error) {
      console.error('Error loading risk data', error);
      return getEmptyRiskData();
    }

    const rows = (data ?? []) as any[];

    let severeCount = 0;
    let moderateCount = 0;
    let lowCount = 0;

    const studentIds = new Set<string>();
    const classIds = new Set<string>();
    const roomLabels = new Set<string>();

    for (const row of rows) {
      const sev = (row.severity || '').toLowerCase();

      if (sev === 'high' || sev === 'severe') {
        severeCount += 1;
      } else if (sev === 'medium' || sev === 'moderate') {
        moderateCount += 1;
      } else if (sev) {
        lowCount += 1;
      }

      if (row.student?.id) studentIds.add(row.student.id as string);
      if (row.class?.id) classIds.add(row.class.id as string);
      if (row.room) roomLabels.add(String(row.room));
    }

    const latestLogs: RiskLog[] = rows.slice(0, 20).map((row) => {
      const studentName = [
        row.student?.first_name,
        row.student?.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      return {
        id: row.id as string,
        created_at: row.created_at as string,
        severity: (row.severity as string | null) ?? null,
        summary: (row.summary as string | null) ?? null,
        student_name: studentName,
        student_code: (row.student?.code as string | null) ?? null,
        class_name: (row.class?.name as string | null) ?? null,
        room_name: row.room ? String(row.room) : null,
      };
    });

    return {
      totalLogs: rows.length,
      severeCount,
      moderateCount,
      lowCount,
      studentsAtRisk: studentIds.size,
      classesAtRisk: classIds.size,
      roomsAtRisk: roomLabels.size,
      latestLogs,
    };
  } catch (err) {
    console.error('Unexpected error loading risk data', err);
    return getEmptyRiskData();
  }
}

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function RiskDashboardPage({ searchParams }: PageProps) {
  const resolvedSearch = await searchParams;

  const rangeParamRaw = resolvedSearch?.range;
  const rangeParam =
    Array.isArray(rangeParamRaw) && rangeParamRaw.length > 0
      ? rangeParamRaw[0]
      : (rangeParamRaw as string | undefined);

  const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(rangeParam);
  const exportUrl = `/api/risk-export?range=${encodeURIComponent(rangeKey)}`;

  const riskData = await getRiskData(rangeKey, fromIso);

  const ranges: { key: RangeKey; label: string }[] = [
    { key: '7d', label: '7 days' },
    { key: '30d', label: '30 days' },
    { key: '90d', label: '90 days' },
    { key: '365d', label: '12 months' },
  ];

  return (
    <main className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Risk dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Overview of behavior risk across students, classes, and rooms. Use
            the filters to change the date range, then print or export this view
            for meetings, parent conferences, or documentation.
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

      {/* Range filters */}
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Range:</span>
          {ranges.map((r) => {
            const isActive = r.key === rangeKey;
            const href = `/risk?range=${r.key}`;

            return (
              <Link
                key={r.key}
                href={href}
                className={[
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                ].join(' ')}
              >
                {r.label}
              </Link>
            );
          })}
          <span className="text-xs text-slate-400">{rangeLabel}</span>
        </div>
      </section>

      {/* Overview panel (cards + latest logs, etc.) */}
      <section className="space-y-4">
        <RiskOverviewPanel data={riskData} rangeLabel={rangeLabel} />
      </section>
    </main>
  );
}

