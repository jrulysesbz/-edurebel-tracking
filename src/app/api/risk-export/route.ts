// src/app/api/risk-export/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

type RangeKey = '7d' | '30d' | '90d' | '365d';

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
    const { key: rangeKey, fromIso, label: rangeLabel } =
      getRangeInfo(rangeParam);

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
      console.error('Error exporting risk logs', error);
      return NextResponse.json(
        { error: 'Failed to export risk logs' },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as any[];

    const header = [
      'Date',
      'Student name',
      'Student code',
      'Class',
      'Room',
      'Severity',
      'Summary',
      'Log ID',
      'Range label',
    ];

    const csvRows: string[] = [];
    csvRows.push(header.join(','));

    for (const row of rows) {
      const studentName = [
        row.student?.first_name,
        row.student?.last_name,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      const studentCode = row.student?.code ?? '';
      const className = row.class?.name ?? '';
      const roomDisplay = row.room ? String(row.room) : '';

      const dateIso = row.created_at
        ? new Date(row.created_at as string).toISOString()
        : '';

      const severity = row.severity ?? '';
      const summary = row.summary ?? '';

      // CSV-safe quoting
      const safe = (value: string) => {
        const v = value.replace(/"/g, '""');
        return `"${v}"`;
      };

      const rowFields = [
        safe(dateIso),
        safe(studentName),
        safe(studentCode),
        safe(className),
        safe(roomDisplay),
        safe(severity),
        safe(summary),
        safe(row.id as string),
        safe(rangeLabel),
      ];

      csvRows.push(rowFields.join(','));
    }

    const csvText = csvRows.join('\n');

    return new NextResponse(csvText, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="risk_logs_${rangeKey}.csv"`,
      },
    });
  } catch (err) {
    console.error('Unexpected error exporting risk logs', err);
    return NextResponse.json(
      { error: 'Unexpected error exporting risk logs' },
      { status: 500 }
    );
  }
}

