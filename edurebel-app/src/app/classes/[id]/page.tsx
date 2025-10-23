import Link from 'next/link';
import { env } from '../../../lib/env';
import RiskPanel from '../../../components/RiskPanel';
import ReportButton from '../../../components/ReportButton';

type ClassRow = { id: string; name: string };
type StudentRow = { id: string; first_name: string | null; last_name: string | null; class_id: string | null };

async function getClassAndStudents(id: string) {
  const [cRes, sRes] = await Promise.all([
    fetch(`${env.SUPABASE_URL}/rest/v1/classes?id=eq.${id}&select=id,name`, {
      headers: { apikey: env.ANON, Authorization: `Bearer ${env.SERVICE}` },
      cache: 'no-store',
    }),
    fetch(`${env.SUPABASE_URL}/rest/v1/students?select=id,first_name,last_name,class_id&class_id=eq.${id}&order=last_name.asc`, {
      headers: { apikey: env.ANON, Authorization: `Bearer ${env.SERVICE}` },
      cache: 'no-store',
    }),
  ]);
  if (!cRes.ok) throw new Error('Failed to load class');
  if (!sRes.ok) throw new Error('Failed to load students');

  const classRows: ClassRow[] = await cRes.json();
  const cls = classRows[0];
  const students: StudentRow[] = await sRes.json();
  return { cls, students };
}

// Note the Promise<{id:string}> typing and await params:
export default async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cls, students } = await getClassAndStudents(id);

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{cls?.name ?? 'Class'}</h1>
        <Link href="/classes" className="text-sm underline">Back</Link>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Students</h2>
        <ul className="space-y-2">
          {students.map(s => {
            const name = `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.id;
            return (
              <li key={s.id} className="border rounded-xl p-3">
        <ReportButton studentId={s.id} />
                <Link href={`/students/${s.id}`} className="hover:underline">{name}</Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <RiskPanel limit={5} />
      </section>
    </main>
  );
}
