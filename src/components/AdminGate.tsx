'use client';

import { useEffect, useState } from 'react';

type GateState = 'checking' | 'allowed' | 'denied';

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>('checking');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch('/api/admin-check', { cache: 'no-store' });
        if (cancelled) return;

        if (res.ok) {
          setState('allowed');
        } else {
          setState('denied');
        }
      } catch {
        if (!cancelled) setState('denied');
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'checking') {
    return (
      <div className="p-4 text-sm text-gray-600">
        Checking admin access…
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
        Access denied. Please sign in with an admin account to view student data.
      </div>
    );
  }

  return <>{children}</>;
}

