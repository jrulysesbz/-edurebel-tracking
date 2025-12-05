import './globals.css';
import type { Metadata } from 'next';
import { MainNav } from '@/components/MainNav';

export const metadata: Metadata = {
  title: 'EDURebel Tracker',
  description: 'Teacher portfolio & student tracking prototype',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 antialiased">
        <MainNav />
        <div className="mx-auto max-w-6xl p-4">{children}</div>
      </body>
    </html>
  );
}

