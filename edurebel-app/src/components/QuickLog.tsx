'use client';
import React, { useCallback, useState } from 'react';
import { getAccessToken } from '../lib/auth';

type Tab = 'attendance'|'behavior'|'positive';

type AttendancePayload = {
  student_id: string;
  type: 'attendance';
  status: 'present'|'absent'|'late'|'excused';
  note?: string;
};

type BehaviorPayload = {
  student_id: string;
  type: 'behavior';
  severity: 'low'|'moderate'|'severe';
  incident: string;
  outcome?: string;
};

type PositivePayload = {
  student_id: string;
  type: 'positive';
  stars: number;
  code?: string;
  note?: string;
};

type ReqPayload = AttendancePayload | BehaviorPayload | PositivePayload;

export default function QuickLog({ studentId }: { studentId: string }) {
  const [tab, setTab] = useState<Tab>('attendance');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string|undefined>(undefined);
  const [err, setErr] = useState<string|undefined>(undefined);

  const submit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true); setMsg(undefined); setErr(undefined);

    const form = new FormData(e.currentTarget);

    const pack: { endpoint: string; payload: ReqPayload } = (() => {
      if (tab === 'attendance') {
        const payload: AttendancePayload = {
          student_id: studentId,
          type: 'attendance',
          status: (String(form.get('status') ?? 'present') as 'present'|'absent'|'late'|'excused'),
          note: String(form.get('note') ?? '') || undefined,
        };
        return { endpoint: '/api/logs/attendance', payload };
      }
      if (tab === 'behavior') {
        const payload: BehaviorPayload = {
          student_id: studentId,
          type: 'behavior',
          severity: (String(form.get('severity') ?? 'low') as 'low'|'moderate'|'severe'),
          incident: String(form.get('incident') ?? ''),
          outcome: String(form.get('outcome') ?? '') || undefined,
        };
        return { endpoint: '/api/logs/behavior', payload };
      }
      const payload: PositivePayload = {
        student_id: studentId,
        type: 'positive',
        stars: Number(String(form.get('stars') ?? '0')),
        code: String(form.get('code') ?? '') || undefined,
        note: String(form.get('note') ?? '') || undefined,
      };
      return { endpoint: '/api/logs/positive', payload };
    })();

    try {
      const token = await getAccessToken();
      const headers: Record<string,string> = { 'Content-Type':'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(pack.endpoint, {
        method:'POST',
        headers,
        body: JSON.stringify(pack.payload),
      });
      const j = await res.json();
      if (!res.ok || j.ok === false) {
        throw new Error(typeof j.error === 'string' ? j.error : JSON.stringify(j.error));
      }
      setMsg('Saved!');
      (e.currentTarget as HTMLFormElement).reset();
      setTimeout(() => setMsg(undefined), 1200);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }, [studentId, tab]);

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex gap-2">
        {(['attendance','behavior','positive'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${tab===t ? 'bg-black text-white' : 'bg-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        {tab === 'attendance' && (
          <div className="space-y-2">
            <label className="block text-sm">Status</label>
            <select name="status" className="border rounded-lg p-2 w-60" defaultValue="present">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
            <input name="note" placeholder="Note (optional)" className="block border rounded-lg p-2 w-full" />
          </div>
        )}

        {tab === 'behavior' && (
          <div className="space-y-2">
            <label className="block text-sm">Severity</label>
            <select name="severity" className="border rounded-lg p-2 w-60" defaultValue="low">
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
            <input name="incident" placeholder="Incident" className="block border rounded-lg p-2 w-full" required />
            <input name="outcome" placeholder="Outcome (optional)" className="block border rounded-lg p-2 w-full" />
          </div>
        )}

        {tab === 'positive' && (
          <div className="space-y-2">
            <label className="block text-sm">Stars</label>
            <input name="stars" type="number" min={0} defaultValue={0} className="border rounded-lg p-2 w-40" />
            <input name="code" placeholder="Code (optional)" className="block border rounded-lg p-2 w-full" />
            <input name="note" placeholder="Note (optional)" className="block border rounded-lg p-2 w-full" />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
          {msg ? <span className="text-green-700 text-sm">{msg}</span> : null}
          {err ? <span className="text-red-600 text-sm">Error: {err}</span> : null}
        </div>
      </form>
    </div>
  );
}
