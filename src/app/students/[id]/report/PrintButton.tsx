'use client';

type Props = {
  label?: string;
};

export function PrintButton({ label = 'Print report' }: Props) {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
    >
      {label}
    </button>
  );
}

