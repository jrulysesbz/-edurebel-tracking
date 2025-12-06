// src/app/api/student-report-export/route.ts
import { supabase } from '@/lib/supabaseServer';

type RangeKey = '7d' | '30d' | '90d' | '12m' | 'all';

function getRangeInfo(
  rangeParam: string | null
): { key: RangeKey; fromIso: string | null; label: string } {
  const now = new Date();

  switch (rangeParam) {
    case '7d': {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return {
        key: '7d',
        fromIso: from.toISOString(),
        label: 'Last 7 days',
      };
    }
    case '90d': {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return {
        key: '90d',
        fromIso: from.toISOString(),
        label: 'Last 90 days',
      };
    }
    case '12m': {
      const from = new Date(now);
      from.setMonth(from.getMonth() - 12);
      return {
        key: '12m',
        fromIso: from.toISOString(),
        label: 'Last 12 months',
      };
    }
    case 'all': {
      return {
        key: 'all',
        fromIso: null,
        label: 'All time',
      };
    }
    case '30d':
    default: {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return {
        key: '30d',
        fromIso: from.toISOString(),
        label: 'Last 30 days',
      };
    }
  }
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get('student_id');
    const rangeParam = url.searchParams.get('range');

    if (!studentId) {
      return new Response('Missing student_id', { status: 400 });
    }

    const { key: rangeKey, fromIso, label: rangeLabel } =
      getRangeInfo(rangeParam);

    const supabaseAny = supabase as any;

    let query = supabaseAny
      .from('behavior_logs')
      .select(
        `
        id,
        created_at,
        severity,
        category,
        room,
        summary,
        student_id,
        class_id,
        students:student_id (
          first_name,
          last_name,
          code
        ),
        classes:class_id (
          name,
          room
        )
      `
      )
      .eq('student_id', studentId)
      .order('created_at', { ascending: true });

    if (fromIso) {
      query = query.gte('created_at', fromIso);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error exporting student report logs', error);
      return new Response('Failed to export logs', { status: 500 });
    }

    const logs = data ?? [];

    const header = [
      'log_id',
      'student_name',
      'student_code',
      'class_name',
      'room',
      'severity',
      'category',
      'summary',
      'created_at',
      'range_label',
    ];

    const rows: string[] = [];
    rows.push(header.map(escapeCsv).join(','));

    for (const row of logs) {
      const studentName = [row.students?.first_name, row.students?.last_name]
        .filter(Boolean)
        .join(' ');
      const studentCode = row.students?.code ?? '';
      const className = row.classes?.name ?? '';
      const room = row.classes?.room ?? row.room ?? '';
      const severity = row.severity ?? 'Unspecified';
      const category = row.category ?? 'Uncategorized';
      const summary = row.summary ?? '';
      const createdAt = row.created_at ?? '';

      const csvRow = [
        row.id,
        studentName,
        studentCode,
        className,
        room,
        severity,
        category,
        summary,
        createdAt,
        rangeLabel,
      ].map(escapeCsv);

      rows.push(csvRow.join(','));
    }

    const body = rows.join('\n');

    const filename = `student-risk-report-${studentId}-${rangeKey}.csv`;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Unexpected error exporting student report logs', err);
    return new Response('Unexpected error exporting logs', { status: 500 });
  }
}

