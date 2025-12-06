// =========================================================
// src/app/page.tsx
// Home / Overview dashboard
// =========================================================

import Link from 'next/link';
import RiskSnapshotCard from '@/components/RiskSnapshotCard';

export const dynamic = 'force-dynamic';

export default function OverviewPage() {
  return (
    <main className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          EDURebel Tracking Overview
        </h1>
        <p className="text-sm text-slate-600">
          Quick links into schools, classes, students, rooms, logs, and risk.
        </p>
      </header>

      {/* Navigation cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/schools"
          className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <h2 className="text-sm font-semibold text-slate-800">Schools</h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage campuses / schools and their basic info.
          </p>
        </Link>

        <Link
          href="/classes"
          className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <h2 className="text-sm font-semibold text-slate-800">Classes</h2>
          <p className="mt-1 text-xs text-slate-500">
            View homerooms, class details, and behavior reports.
          </p>
        </Link>

        <Link
          href="/students"
          className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <h2 className="text-sm font-semibold text-slate-800">Students</h2>
          <p className="mt-1 text-xs text-slate-500">
            Search students, open profiles, and print individual reports.
          </p>
        </Link>

        <Link
          href="/rooms"
          className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <h2 className="text-sm font-semibold text-slate-800">Rooms</h2>
          <p className="mt-1 text-xs text-slate-500">
            Track rooms used for support, counseling, or reflection time.
          </p>
        </Link>

        <Link
          href="/logs"
          className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <h2 className="text-sm font-semibold text-slate-800">Logs</h2>
          <p className="mt-1 text-xs text-slate-500">
            Filter and review behavior logs across students and classes.
          </p>
        </Link>

        <Link
          href="/risk"
          className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
        >
          <h2 className="text-sm font-semibold text-slate-800">
            Risk dashboard
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Explore high-risk patterns and drill into recent incidents.
          </p>
        </Link>
      </section>

      {/* Risk snapshot card */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">
          Risk snapshot
        </h2>
        <p className="text-xs text-slate-500">
          Quick view of behavior risk across the school. Click through for full
          filters and drill-down.
        </p>
        <RiskSnapshotCard />
      </section>
    </main>
  );
}

