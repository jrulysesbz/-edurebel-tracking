// =========================================================
// src/app/students/page.tsx
// =========================================================

import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';
import StudentsClient from './StudentsClient';

export const dynamic = 'force-dynamic';

type StudentRow = Database['public']['Tables']['students']['Row'];
type ClassRow = Database['public']['Tables']['classes']['Row'];

export type StudentWithClass = StudentRow & {
  class_name: string | null;
  class_room: string | null;
};

type SearchParams = {
  q?: string;
  class_id?: string;
  status?: string;
};

// ---------- safer helpers with try/catch ----------

async function getStudents(
  search: string,
  classId: string,
  status: string
): Promise<StudentWithClass[]> {
  const supabaseAny = supabase as any;

  try {
    let query = supabaseAny
      .from('students')
      .select(
        `
          id,
          first_name,
          last_name,
          code,
          is_live,
          class_id,
          classes:class_id (
            id,
            name,
            room
          )
        `
      )
      .order('first_name', { ascending: true });

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,code.ilike.%${search}%`
      );
    }

    if (classId) {
      query = query.eq('class_id', classId);
    }

    if (status === 'live') {
      query = query.eq('is_live', true);
    } else if (status === 'inactive') {
      query = query.eq('is_live', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading students', error);
      return [];
    }

    const mapped = (data ?? []).map((row: any) => ({
      ...row,
      class_name: row.classes?.name ?? null,
      class_room: row.classes?.room ?? null,
    })) as StudentWithClass[];

    return mapped;
  } catch (err) {
    console.error('Unexpected error loading students', err);
    return [];
  }
}

async function getClasses(): Promise<ClassRow[]> {
  const supabaseAny = supabase as any;

  try {
    const { data, error } = await supabaseAny
      .from('classes')
      .select('id, name, room')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading classes', error);
      return [];
    }

    return (data ?? []) as ClassRow[];
  } catch (err) {
    console.error('Unexpected error loading classes', err);
    return [];
  }
}

// ---------- page component ----------

export default async function StudentsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;

  const search = searchParams.q ?? '';
  const selectedClassId = searchParams.class_id ?? '';
  const status = searchParams.status ?? 'all';

  const [students, classes] = await Promise.all([
    getStudents(search, selectedClassId, status),
    getClasses(),
  ]);

  return (
    <StudentsClient
      students={students}
      classes={classes}
      search={search}
      selectedClassId={selectedClassId}
    />
  );
}

