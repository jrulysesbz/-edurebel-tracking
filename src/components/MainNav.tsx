'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/schools', label: 'Schools' },
  { href: '/classes', label: 'Classes' },
  { href: '/students', label: 'Students' },
  { href: '/rooms', label: 'Rooms' },
  { href: '/logs', label: 'Logs' },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-sm font-semibold text-white">
            ER
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            EDURebel Tracker
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'rounded-md px-2.5 py-1.5 text-xs font-medium',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

