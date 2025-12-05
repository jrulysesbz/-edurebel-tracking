// src/components/MainNav.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/schools', label: 'Schools' },
  { href: '/classes', label: 'Classes' },
  { href: '/students', label: 'Students' },
  { href: '/rooms', label: 'Rooms' },
  { href: '/logs', label: 'Logs' },
  { href: '/risk', label: 'Risk dashboard' }, // ✅ new item
];

export default function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
      {links.map((link) => {
        const isActive =
          link.href === '/'
            ? pathname === '/'
            : pathname === link.href || pathname.startsWith(link.href + '/');

        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              'inline-flex items-center rounded-full border px-3 py-1 transition-colors',
              isActive
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
            ].join(' ')}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

