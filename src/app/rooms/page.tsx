import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

type ClassRow = Database['public']['Tables']['classes']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];

type RoomStats = {
  roomName: string;
  classes: ClassRow[];
  total: number;
  high: number;
  medium: number;
  watch: number;
  low: number;
};

async function getRoomStats(): Promise<RoomStats[]> {
  const [{ data: classes, error: classesError }, { data: students, error: studentsError }] =
    await Promise.all([
      supabase
        .from('classes')
        .select('id, name, grade_level, room, homeroom_teacher')
        .order('name', { ascending: true }),
      supabase
        .from('students')
        .select('id, class_id, risk_level')
        .order('full_name', { ascending: true }),
    ]);

  if (classesError) {
    console.error('Error loading classes for rooms view', classesError);
  }
  if (studentsError) {
    console.error('Error loading students for rooms view', studentsError);
  }

  const safeClasses: ClassRow[] = classes ?? [];
  const safeStudents: StudentRow[] = (students as any) ?? [];

  const classesById = new Map<string, ClassRow>();
  for (const c of safeClasses) {
    if (c.id) {
      classesById.set(c.id, c);
    }
  }

  const roomMap = new Map<string, RoomStats>();

  function ensureRoom(roomName: string): RoomStats {
    const key = roomName || 'Unassigned';
    const existing = roomMap.get(key);
    if (existing) return existing;

    const stats: RoomStats = {
      roomName: key,
      classes: [],
      total: 0,
      high: 0,
      medium: 0,
      watch: 0,
      low: 0,
    };
    roomMap.set(key, stats);
    return stats;
  }

  // Ensure every class creates a room row (even if 0 students)
  for (const c of safeClasses) {
    const roomName = ((c.room as string | null) ?? 'Unassigned').trim() || 'Unassigned';
    const stats = ensureRoom(roomName);
    if (!stats.classes.some((existing) => existing.id === c.id)) {
      stats.classes.push(c);
    }
  }

  // Count students by their class' room
  for (const s of safeStudents) {
    const classId = (s.class_id as string | null) ?? null;
    const cls = classId ? classesById.get(classId) : undefined;
    const roomName = ((cls?.room as string | null) ?? 'Unassigned').trim() || 'Unassigned';
    const stats = ensureRoom(roomName);

    stats.total += 1;

    const risk = ((s.risk_level as string | null) ?? 'low').toLowerCase();
    if (risk === 'high') stats.high += 1;
    else if (risk === 'medium') stats.medium += 1;
    else if (risk === 'watch') stats.watch += 1;
    else stats.low += 1;
  }

  const rooms = Array.from(roomMap.values());
  rooms.sort((a, b) => a.roomName.localeCompare(b.roomName));

  // Sort classes inside each room
  for (const r of rooms) {
    r.classes.sort((a, b) => {
      const aName = (a.name || '').toString();
      const bName = (b.name || '').toString();
      return aName.localeCompare(bName);
    });
  }

  return rooms;
}

export default async function RoomsPage() {
  const rooms = await getRoomStats();

  const totalStudents = rooms.reduce((sum, r) => sum + r.total, 0);
  const totalHigh = rooms.reduce((sum, r) => sum + r.high, 0);
  const totalMedium = rooms.reduce((sum, r) => sum + r.medium, 0);
  const totalWatch = rooms.reduce((sum, r) => sum + r.watch, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Rooms overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Homeroom risk snapshot by physical room, derived from classes and students.
          </p>
        </div>
      </div>

      {/* Global summary */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500 uppercase">
            Total students
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {totalStudents}
          </p>
        </div>
        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
          <p className="text-xs font-medium text-red-700 uppercase">
            High risk
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-800">
            {totalHigh}
          </p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-700 uppercase">
            Medium risk
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">
            {totalMedium}
          </p>
        </div>
        <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
          <p className="text-xs font-medium text-purple-700 uppercase">
            Watch list
          </p>
          <p className="mt-1 text-2xl font-semibold text-purple-800">
            {totalWatch}
          </p>
        </div>
      </div>

      {/* Room table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Room
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Classes
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Students
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                High
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Medium
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Watch
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Low / other
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rooms.map((room) => (
              <tr key={room.roomName} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-sm font-medium text-slate-800">
                  {room.roomName}
                </td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {room.classes.length > 0
                    ? room.classes.map((c) => c.name).join(', ')
                    : '—'}
                </td>
                <td className="px-4 py-2 text-right text-sm text-slate-900">
                  {room.total}
                </td>
                <td className="px-4 py-2 text-right text-sm text-red-700">
                  {room.high}
                </td>
                <td className="px-4 py-2 text-right text-sm text-amber-700">
                  {room.medium}
                </td>
                <td className="px-4 py-2 text-right text-sm text-purple-700">
                  {room.watch}
                </td>
                <td className="px-4 py-2 text-right text-sm text-slate-700">
                  {room.low}
                </td>
                <td className="px-4 py-2 text-right text-sm">
                  {room.classes[0]?.id ? (
                    <Link
                      href={`/students?class_id=${room.classes[0].id}`}
                      className="inline-flex items-center rounded-md border border-sky-500 px-2.5 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                    >
                      View students
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">No class linked</span>
                  )}
                </td>
              </tr>
            ))}

            {rooms.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No classes or rooms found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

