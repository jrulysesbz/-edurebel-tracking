'use client';

import * as React from 'react';

type PrintButtonProps = {
  label?: string;
  className?: string;
};

export default function PrintButton({
  label = 'Print',
  className = '',
}: PrintButtonProps) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ||
        'inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1'
      }
    >
      {label}
    </button>
  );
}

