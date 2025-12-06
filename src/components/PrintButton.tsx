'use client';

type PrintButtonProps = {
  label?: string;
};

export default function PrintButton({ label = 'Print' }: PrintButtonProps) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="no-print inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
    >
      {label}
    </button>
  );
}

