import Link from 'next/link';
import { NewLogForm } from '../NewLogForm';

export const dynamic = 'force-dynamic';

type SearchParams = {
  student_id?: string;
  class_id?: string;
};

export default async function NewLogPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const initialStudentId = searchParams.student_id;
  const initialClassId = searchParams.class_id;

  return (
    <main className="space-y-6">
      <div className="text-xs text-slate-500">
        <Link href="/logs" className="hover:underline">
          ← Back to logs
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          New behavior log
        </h1>
        <p className="text-sm text-slate-600">
          Record a quick entry. Student and class are optional, but auto-filled
          when coming from a student profile.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <NewLogForm
          initialStudentId={initialStudentId}
          initialClassId={initialClassId}
        />
      </section>
    </main>
  );
}

