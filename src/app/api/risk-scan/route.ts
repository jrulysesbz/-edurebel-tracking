// src/app/api/risk-scan/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

type RangeKey = '7d' | '30d' | '90d' | '365d';

type RiskScanResponse = {
  totalLogs: number;
  severeCount: number;
  moderateCount: number;
  lowCount: number;
  studentsAtRisk: number;
  classesAtRisk: number;
  roomsAtRisk: number;
  rangeLabel: string;
  lastLogAt: string | null;
};

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

export async function GET(req: Request) {
  const supabaseAny = supabase as any;

  if (!supabaseAny || typeof supabaseAny.from !== 'function') {
    console.error(
      'Supabase server client is not configured correctly in supabaseServer.ts'
    );
    return NextResponse.json(
      { error: 'Supabase client not configured' },
      { status: 500 }
    );
  }

  try {
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get('range');
    const studentFilter = url.searchParams.get('student_id') || null;
    const { key: rangeKey, fromIso, label: rangeLabel } =
      getRangeInfo(rangeParam);

    let logsQuery = supabaseAny
      .from('behavior_logs')
      .select(
        `
        id,
        created_at,
        severity,
        student_id,
        class_id,
        room
      `
      )
      .order('created_at', { ascending: false });

    if (fromIso) {
      logsQuery = logsQuery.gte('created_at', fromIso);
    }

    if (studentFilter) {
      logsQuery = logsQuery.eq('student_id', studentFilter);
    }

    const { data, error } = await logsQuery;

    if (error) {
      console.error('Error loading risk scan data', error);
      const empty: RiskScanResponse = {
        totalLogs: 0,
        severeCount: 0,
        moderateCount: 0,
        lowCount: 0,
        studentsAtRisk: 0,
        classesAtRisk: 0,
        roomsAtRisk: 0,
        rangeLabel,
        lastLogAt: null,
      };
      return NextResponse.json(empty);
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

      if (row.student_id) studentIds.add(String(row.student_id));
      if (row.class_id) classIds.add(String(row.class_id));
      if (row.room) roomLabels.add(String(row.room));
    }

    const lastLogAt =
      rows.length > 0 && rows[0].created_at
        ? new Date(rows[0].created_at as string).toISOString()
        : null;

    const response: RiskScanResponse = {
      totalLogs: rows.length,
      severeCount,
      moderateCount,
      lowCount,
      studentsAtRisk: studentIds.size,
      classesAtRisk: classIds.size,
      roomsAtRisk: roomLabels.size,
      rangeLabel,
      lastLogAt,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Unexpected error loading risk scan data', err);
    const empty: RiskScanResponse = {
      totalLogs: 0,
      severeCount: 0,
      moderateCount: 0,
      lowCount: 0,
      studentsAtRisk: 0,
      classesAtRisk: 0,
      roomsAtRisk: 0,
      rangeLabel: 'Unknown',
      lastLogAt: null,
    };
    return NextResponse.json(empty, { status: 500 });
  }
}

