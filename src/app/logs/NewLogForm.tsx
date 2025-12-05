'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

type BehaviorLogInsert = Database['public']['Tables']['behavior_logs']['Insert'];

type NewLogFormProps = {
  initialStudentId?: string;
  initialClassId?: string;
};

export function NewLogForm({
  initialStudentId,
  initialClassId,
}: NewLogFormProps) {
  const router = useRouter();

  const [studentId, setStudentId] = useState(initialStudentId ?? '');
  const [classId, setClassId] = useState(initialClassId ?? '');
  const [level, setLevel] = useState('');
  const [room, setRoom] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabaseAny = supabase as any;

    const payload: BehaviorLogInsert = {
      student_id: studentId || null,
      class_id: classId || null,
      level: level || null,
      room: room || null,
      summary: summary || null,
      details: details || null,
      occurred_at: new Date().toISOString(),
    };

    const { error } = await supabaseAny
      .from('behavior_logs')
      .insert([payload]);

    if (error) {
      console.error('Error inserting behavior log', error);
      setError(error.message ?? 'Failed to save behavior log.');
      setSaving(false);
      return;
    }

    router.push('/logs');
  }

  return (
    <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="student_id"
            className="text-xs font-medium text-slate-600"
          >
            Student ID (optional)
          </label>
          <input
            id="student_id"
            name="student_id"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-slate-400"
            placeholder="Paste student UUID or leave blank"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="class_id"
            className="text-xs font-medium text-slate-600"
          >
            Class ID (optional)
          </label>
          <input
            id="class_id"
            name="class_id"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-slate-400"
            placeholder="Paste class UUID or leave blank"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="level"
            className="text-xs font-medium text-slate-600"
          >
            Level
          </label>
          <select
            id="level"
            name="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-slate-400"
          >
            <option value="">Select…</option>
            <option value="info">Info</option>
            <option value="minor">Minor</option>
            <option value="major">Major</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="room"
            className="text-xs font-medium text-slate-600"
          >
            Room (optional)
          </label>
          <input
            id="room"
            name="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-slate-400"
            placeholder="e.g. 201, Gym"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="summary"
          className="text-xs font-medium text-slate-600"
        >
          Summary
        </label>
        <input
          id="summary"
          name="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-slate-400"
          placeholder="Short description (what happened?)"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="details"
          className="text-xs font-medium text-slate-600"
        >
          Details (optional)
        </label>
        <textarea
          id="details"
          name="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="min-h-[80px] rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-slate-400"
          placeholder="Add context, triggers, responses, follow-up, etc."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.push('/logs')}
          className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save log'}
        </button>
      </div>
    </form>
  );
}

