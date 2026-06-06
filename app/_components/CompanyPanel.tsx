"use client";

interface CompanyPanelProps {
  customerName: string;
  customerEmail: string;
  onChangeCompany: () => void;
}

export default function CompanyPanel({
  customerName,
  customerEmail,
  onChangeCompany,
}: CompanyPanelProps) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          Odberateľ
        </div>
        <div className="mt-1 truncate text-lg font-extrabold leading-tight tracking-tight">
          {customerName}
        </div>
        <div className="mt-0.5 truncate text-sm text-muted">{customerEmail}</div>
      </div>
      <button
        type="button"
        onClick={onChangeCompany}
        className="-mr-1 inline-flex shrink-0 items-center gap-0.5 rounded px-2 py-1.5 text-sm font-bold text-accent transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
      >
        Zmeniť
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
