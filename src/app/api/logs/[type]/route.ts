import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../lib/env';

type InsertReq =
  | { student_id: string; type: 'attendance'; status: 'present'|'absent'|'late'|'excused'; note?: string }
  | { student_id: string; type: 'behavior'; severity: 'low'|'moderate'|'severe'; incident: string; outcome?: string }
  | { student_id: string; type: 'positive'; stars: number; code?: string; note?: string };

async function getStudentContext(student_id: string): Promise<{ school_id: string|null; class_id: string|null }> {
  const url = `${env.SUPABASE_URL}/rest/v1/students?id=eq.${student_id}&select=school_id,class_id&limit=1`;
  const res = await fetch(url, { headers: { apikey: env.ANON, Authorization: `Bearer ${env.SERVICE}` }, cache: 'no-store' });
  if (!res.ok) return { school_id: null, class_id: null };
  const rows = await res.json() as Array<{ school_id: string|null; class_id: string|null }>;
  return rows[0] ?? { school_id: null, class_id: null };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ type: string }> }) {
  const { type } = await ctx.params;
  const body = await req.json() as InsertReq;
  if (!('student_id' in body) || !body.student_id) {
    return NextResponse.json({ ok:false, error:'student_id required' }, { status:400 });
  }

  // Look up school_id (and class_id if we later need it)
  const { school_id } = await getStudentContext(body.student_id);
  if (!school_id) {
    return NextResponse.json({ ok:false, error:'student not found or missing school_id' }, { status:400 });
  }

  let table = '';
  let payload: Record<string, unknown> = { student_id: body.student_id, school_id };
  if (type === 'attendance' && body.type === 'attendance') {
    table = 'attendance_logs';
    payload = { ...payload, status: body.status, note: body.note ?? null };
  } else if (type === 'behavior' && body.type === 'behavior') {
    table = 'behavior_logs';
    payload = { ...payload, severity: body.severity, incident: body.incident, outcome: body.outcome ?? null };
  } else if (type === 'positive' && body.type === 'positive') {
    table = 'positive_logs';
    payload = { ...payload, stars: body.stars ?? 0, code: body.code ?? null, note: body.note ?? null };
  } else {
    return NextResponse.json({ ok:false, error:'invalid type/body' }, { status:400 });
  }

  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: env.ANON,
      Authorization: `Bearer ${env.SERVICE}`,    // server-side only
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? JSON.parse(text) : text;

  if (!res.ok) {
    return NextResponse.json({ ok:false, error:data }, { status: res.status });
  }
  return NextResponse.json({ ok:true, data });
}
