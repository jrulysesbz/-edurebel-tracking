import Link from 'next/link';
import { env } from '../../lib/env';

async function getClasses() {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/classes?select=id,name,school_id&order=name.asc`, {
    headers: { apikey: env.ANON, Authorization: `Bearer ${env.SERVICE}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load classes');
  return res.json() as Promise<Array<{ id: string; name: string; school_id: string }>>;
}

export default async function ClassesPage() {
  const classes = await getClasses();
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Classes</h1>
      <ul className="space-y-2">
        {classes.map(c => (
          <li key={c.id} className="border rounded-xl p-4 hover:bg-gray-50">
            <Link href={`/classes/${c.id}`} className="font-medium">{c.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
