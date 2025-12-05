// =========================================================
// src/app/risk/page.tsx
// =========================================================

import RiskPanel from '@/components/RiskPanel';

export const dynamic = 'force-dynamic';

export default function RiskDashboardPage() {
  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Risk dashboard
        </h1>
        <p className="text-sm text-slate-600">
          At-a-glance view of recent behavior risk signals across classes and
          students. Use this page to spot patterns early and prioritize
          follow-up.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        {/* The RiskPanel component handles the actual data + visuals */}
        <RiskPanel />
      </section>

      <section className="space-y-2 text-xs text-slate-500">
        <h2 className="text-sm font-semibold text-slate-700">
          How to use this dashboard
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Look for spikes in high-risk incidents by class or student and
            coordinate with homeroom / support teams.
          </li>
          <li>
            Use it together with individual student reports to document
            interventions over time.
          </li>
          <li>
            Treat this page as an early-warning radar, not a final judgment on
            any student.
          </li>
        </ul>
      </section>
    </main>
  );
}

