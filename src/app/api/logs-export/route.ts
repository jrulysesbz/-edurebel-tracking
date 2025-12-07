import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';

type RangeKey = '7d' | '30d' | '90d' | '12m';

type SeverityFilter = 'high' | 'medium' | 'low' | null;
type CategoryFilter =
  | 'disruption'
  | 'work'
  | 'respect'
  | 'safety'
  | 'other'
  | null;

type BehaviorLogRow = Database['public']['Tables']['behavior_logs']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

interface BehaviorLogWithRelations extends BehaviorLogRow {
  students: Pick<StudentRow, 'id' | 'first_name' | 'last_name' | 'code'> | null;
  classes: Pick<ClassRow, 'id' | 'name' | 'room'> | null;
}

function getRangeInfo(raw: string | null): {
  key: RangeKey;
  fromIso: string | null;
  label: string;
} {
  const now = new Date();

  let key: RangeKey = '30d';
  if (raw === '7d' || raw === '90d' || raw === '12m') {
    key = raw;
  }

  let from: Date | null = new Date(now);
  let label = '';

  switch (key) {
    case '7d': {
      from.setDate(now.getDate() - 7);
      label = 'Last 7 days';
      break;
    }
    case '30d': {
      from.setDate(now.getDate() - 30);
      label = 'Last 30 days';
      break;
    }
    case '90d': {
      from.setDate(now.getDate() - 90);
      label = 'Last 90 days';
      break;
    }
    case '12m': {
      from.setFullYear(now.getFullYear() - 1);
      label = 'Last 12 months';
      break;
    }
  }

  return {
    key,
    fromIso: from ? from.toISOString() : null,
    label,
  };
}

function normalizeSeverity(param: string | null): SeverityFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (v === 'high' || v === 'medium' || v === 'low') return v;
  return null;
}

function normalizeCategory(param: string | null): CategoryFilter {
  if (!param) return null;
  const v = param.toLowerCase();
  if (
    v === 'disruption' ||
    v === 'work' ||
    v === 'respect' ||
    v === 'safety' ||
    v === 'other'
  ) {
    return v;
  }
  return null;
}

function studentDisplayName(
  s: BehaviorLogWithRelations['students'],
): string {
  if (!s) return 'Unknown student';
  const parts = [s.first_name, s.last_name].filter(Boolean);
  const base = parts.length > 0 ? parts.join(' ') : s.code || 'Unknown student';
  if (s.code) {
    return `${base} (${s.code})`;
  }
  return base;
}

function classDisplayName(c: BehaviorLogWithRelations['classes']): string {
  if (!c) return 'Unknown class';
  return c.name || 'Unknown class';
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const rangeParam = searchParams.get('range');
    const severityParam = searchParams.get('severity');
    const categoryParam = searchParams.get('category');
    const studentIdParam = searchParams.get('student_id');
    const classIdParam = searchParams.get('class_id');

    const { key: rangeKey, fromIso, label: rangeLabel } = getRangeInfo(rangeParam);
    const severityFilter = normalizeSeverity(severityParam);
    const categoryFilter = normalizeCategory(categoryParam);
    const studentIdFilter = studentIdParam || null;
    const classIdFilter = classIdParam || null;

    const supabaseAny = supabase as any;

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
      `,
      )
      .order('created_at', { ascending: false });

    if (fromIso) {
      query = query.gte('created_at', fromIso);
    }
    if (severityFilter) {
      query = query.eq('severity', severityFilter);
    }
    if (categoryFilter) {
      query = query.eq('category', categoryFilter);
    }
    if (studentIdFilter) {
      query = query.eq('student_id', studentIdFilter);
    }
    if (classIdFilter) {
      query = query.eq('class_id', classIdFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error exporting behavior logs', error);
      return new Response('Error exporting logs', { status: 500 });
    }

    const logs = (data ?? []) as BehaviorLogWithRelations[];

    const header = [
      'Date/Time',
      'Student',
      'Class',
      'Room',
      'Severity',
      'Category',
      'Summary',
      'Student ID',
      'Class ID',
      'Log ID',
      'Range',
    ].join(',');

    const rows = logs.map((log) => {
      const dateStr = log.created_at ?? '';
      const studentName = studentDisplayName(log.students);
      const className = classDisplayName(log.classes);
      const room =
        log.classes?.room || log.room || '';

      const severity = log.severity || '';
      const category = log.category || '';
      const summary = log.summary || '';

      const studentId = log.student_id || '';
      const classId = log.class_id || '';
      const logId = log.id || '';

      const cells = [
        dateStr,
        studentName,
        className,
        room,
        severity,
        category,
        summary,
        studentId,
        classId,
        logId,
        rangeLabel,
      ].map((value) => {
        const str = value ?? '';
        const escaped = str.replace(/"/g, '""');
        if (/[",\n]/.test(escaped)) {
          return `"${escaped}"`;
        }
        return escaped;
      });

      return cells.join(',');
    });

    const body = [header, ...rows].join('\n');
    const filename = `behavior-logs-${rangeKey}${
      severityFilter ? `-severity-${severityFilter}` : ''
    }${categoryFilter ? `-category-${categoryFilter}` : ''}${
      studentIdFilter ? `-student-${studentIdFilter}` : ''
    }${classIdFilter ? `-class-${classIdFilter}` : ''}.csv`;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Unexpected error exporting logs', err);
    return new Response('Unexpected error exporting logs', { status: 500 });
  }
}

