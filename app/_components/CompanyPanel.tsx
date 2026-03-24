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
    <div className="flex items-center gap-3 rounded-xl bg-surface p-4 shadow-md sm:p-5">
      <div className="min-w-0 flex-1">
        <div className="text-lg font-bold leading-tight truncate">{customerName}</div>
        <div className="mt-0.5 text-sm text-muted truncate">{customerEmail}</div>
      </div>
      <button
        type="button"
        onClick={onChangeCompany}
        className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-alt active:scale-[0.98]"
      >
        Zmeniť
      </button>
    </div>
  );
}
