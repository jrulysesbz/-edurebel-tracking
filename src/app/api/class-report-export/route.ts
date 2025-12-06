import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type RangeKey = '7d' | '30d' | '90d' | '12m';

function resolveRange(rangeRaw: string | null): {
  key: RangeKey;
  label: string;
  fromIso: string | null;
} {
  const now = new Date();
  let key: RangeKey = '30d';
  let label = 'Last 30 days';
  let from: Date | null = new Date(now);

  switch (rangeRaw) {
    case '7d':
      key = '7d';
      label = 'Last 7 days';
      from.setDate(now.getDate() - 7);
      break;
    case '90d':
      key = '90d';
      label = 'Last 90 days';
      from.setDate(now.getDate() - 90);
      break;
    case '12m':
      key = '12m';
      label = 'Last 12 months';
      from.setFullYear(now.getFullYear() - 1);
      break;
    case '30d':
    default:
      key = '30d';
      label = 'Last 30 days';
      from.setDate(now.getDate() - 30);
      break;
  }

  const fromIso = from ? from.toISOString() : null;
  return { key, label, fromIso };
}

function csvValue(input: unknown): string {
  if (input === null || input === undefined) return '""';
  const str = String(input);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const classId = url.searchParams.get('class_id');
  const rangeRaw = url.searchParams.get('range');

  if (!classId) {
    return new Response('Missing class_id', { status: 400 });
  }

  const { key: rangeKey, label: rangeLabel, fromIso } = resolveRange(rangeRaw);

  const supabaseAny = supabaseAdmin as any;

  try {
    // 1) Load logs for this class in range
    let logsQuery = supabaseAny
      .from('behavior_logs')
      .select(
        `
          id,
          created_at,
          student_id,
          class_id,
          category,
          severity,
          summary,
          room
        `
      )
      .eq('class_id', classId)
      .order('created_at', { ascending: true });

    if (fromIso) {
      logsQuery = logsQuery.gte('created_at', fromIso);
    }

    const { data: logs, error: logsError } = await logsQuery;

    if (logsError) {
      console.error('Error loading class report logs', logsError);
      return new Response('Error loading logs', { status: 500 });
    }

    const logsData = (logs ?? []) as Array<{
      id: string;
      created_at: string;
      student_id: string | null;
      class_id: string | null;
      category: string | null;
      severity: string | null;
      summary: string | null;
      room: string | null;
    }>;

    // If no logs, just return a header row so the CSV is still valid
    if (!logsData.length) {
      const headers = [
        'log_id',
        'class_id',
        'class_name',
        'room',
        'student_id',
        'student_name',
        'student_code',
        'severity',
        'category',
        'summary',
        'created_at',
        'range_key',
        'range_label',
      ];
      const body = `${headers.join(',')}\n`;

      const filename = `class-risk-report-${classId}-${rangeKey}.csv`;

      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // 2) Load related students and classes manually (avoid relationship issues)
    const studentIds = Array.from(
      new Set(
        logsData
          .map((log) => log.student_id)
          .filter((id): id is string => !!id)
      )
    );

    const classIds = Array.from(
      new Set(
        logsData
          .map((log) => log.class_id)
          .filter((id): id is string => !!id)
          .concat(classId)
      )
    );

    const [studentsRes, classesRes] = await Promise.all([
      studentIds.length
        ? supabaseAny
            .from('students')
            .select('id, first_name, last_name, code')
            .in('id', studentIds)
        : Promise.resolve({ data: [], error: null }),
      classIds.length
        ? supabaseAny
            .from('classes')
            .select('id, name, room')
            .in('id', classIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (studentsRes.error) {
      console.error('Error loading students for class report', studentsRes.error);
    }
    if (classesRes.error) {
      console.error('Error loading classes for class report', classesRes.error);
    }

    const studentsData =
      (studentsRes.data as
        | Array<{
            id: string;
            first_name: string | null;
            last_name: string | null;
            code: string | null;
          }>
        | null) ?? [];

    const classesData =
      (classesRes.data as
        | Array<{
            id: string;
            name: string | null;
            room: string | null;
          }>
        | null) ?? [];

    const studentsById = new Map(
      studentsData.map((s) => [s.id, s])
    );
    const classesById = new Map(
      classesData.map((c) => [c.id, c])
    );

    // 3) Build CSV rows
    const headers = [
      'log_id',
      'class_id',
      'class_name',
      'room',
      'student_id',
      'student_name',
      'student_code',
      'severity',
      'category',
      'summary',
      'created_at',
      'range_key',
      'range_label',
    ];

    const rows: string[] = [];
    rows.push(headers.map(csvValue).join(','));

    for (const log of logsData) {
      const student = log.student_id ? studentsById.get(log.student_id) : undefined;
      const cls = (log.class_id && classesById.get(log.class_id)) ?? classesById.get(classId);

      const studentName = student
        ? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim()
        : '';
      const studentCode = student?.code ?? '';

      const className = cls?.name ?? '';
      const room = cls?.room ?? log.room ?? '';

      const row = [
        log.id,
        log.class_id ?? classId,
        className,
        room,
        log.student_id ?? '',
        studentName,
        studentCode,
        log.severity ?? '',
        log.category ?? '',
        log.summary ?? '',
        log.created_at,
        rangeKey,
        rangeLabel,
      ].map(csvValue);

      rows.push(row.join(','));
    }

    const body = rows.join('\n');
    const filename = `class-risk-report-${classId}-${rangeKey}.csv`;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Unexpected error exporting class report logs', err);
    return new Response('Unexpected error exporting logs', { status: 500 });
  }
}

