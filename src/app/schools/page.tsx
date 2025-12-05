import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/supabase.types';

type School = Database['public']['Tables']['schools']['Row'];

export const revalidate = 0;

export default async function SchoolsPage() {
  const { data, error } = await supabase
    .from('schools')
    .select('id,name')
    .order('name')
    .limit(50)
    .returns<Pick<School, 'id' | 'name'>[]>();

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Schools</h1>
        <p className="text-red-600">Error: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Schools</h1>
      {!data || data.length === 0 ? (
        <p>No schools found.</p>
      ) : (
        <ul className="list-disc pl-5">
          {data.map((school) => (
            <li key={school.id}>{school.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}

