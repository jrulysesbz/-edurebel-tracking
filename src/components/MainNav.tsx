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
  { href: '/risk', label: 'Risk dashboard' }, // ⬅ new
];

function MainNav() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          EDURebel Tracker
        </Link>

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
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                ].join(' ')}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

// Export both ways so layout.tsx is happy no matter how it imports
export { MainNav };
export default MainNav;

