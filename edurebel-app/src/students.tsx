// src/app/students/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  grade_level: string | null;
};

export default function StudentsPage() {
  const [rows, setRows] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, date_of_birth, grade_level')
        .limit(50);

      if (!isMounted) return;
      if (error) setError(error.message);
      else setRows(data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (error) return <div style={{ padding: 16, color: 'crimson' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Students</h1>
      {rows.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <ul>
          {rows.map((s) => (
            <li key={s.id}>
              {s.first_name} {s.last_name} {s.grade_level ? `— ${s.grade_level}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}