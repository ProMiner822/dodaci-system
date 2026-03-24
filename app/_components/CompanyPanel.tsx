"use client";

import type { Company } from "@/lib/types";

interface CompanyPanelProps {
  companies: Company[];
  selectedCompanyId: string;
  customerEmail: string;
  onSelectCompany: (id: string) => void;
  onEmailChange: (email: string) => void;
  onUpdateCompany: (field: keyof Company, value: string | number) => void;
  onAddCompany: () => void;
  selectedCompany: Company | undefined;
}

const inputClasses =
  "w-full min-h-[44px] rounded-lg border border-border bg-surface px-3 py-3 text-base transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export default function CompanyPanel({
  companies,
  selectedCompanyId,
  customerEmail,
  onSelectCompany,
  onEmailChange,
  onUpdateCompany,
  onAddCompany,
  selectedCompany,
}: CompanyPanelProps) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-md sm:p-5">
      <h2 className="mb-3 text-lg font-bold">Firma</h2>

      <label htmlFor="company-select" className="mb-1.5 mt-2 block text-sm font-bold">
        Odberateľ
      </label>
      <select
        id="company-select"
        className={inputClasses}
        value={selectedCompanyId}
        onChange={(e) => onSelectCompany(e.target.value)}
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>

      <label htmlFor="company-email" className="mb-1.5 mt-2 block text-sm font-bold">
        Email
      </label>
      <input
        id="company-email"
        type="email"
        autoComplete="email"
        className={inputClasses}
        value={customerEmail}
        onChange={(e) => onEmailChange(e.target.value)}
      />

      <label htmlFor="company-address" className="mb-1.5 mt-2 block text-sm font-bold">
        Adresa
      </label>
      <input
        id="company-address"
        className={inputClasses}
        value={selectedCompany?.address ?? ""}
        onChange={(e) => onUpdateCompany("address", e.target.value)}
      />

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="company-ico" className="mb-1.5 block text-sm font-bold">
            IČO
          </label>
          <input
            id="company-ico"
            className={inputClasses}
            value={selectedCompany?.ico ?? ""}
            onChange={(e) => onUpdateCompany("ico", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="company-icdph" className="mb-1.5 block text-sm font-bold">
            IČ DPH
          </label>
          <input
            id="company-icdph"
            className={inputClasses}
            value={selectedCompany?.icdph ?? ""}
            onChange={(e) => onUpdateCompany("icdph", e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onAddCompany}
        className="mt-3 min-h-[44px] w-full rounded-lg border border-border bg-surface-alt px-3.5 py-3 font-bold transition-colors hover:bg-border/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
      >
        Pridať firmu
      </button>
    </div>
  );
}
