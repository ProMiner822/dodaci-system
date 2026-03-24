"use client";

import { useState } from "react";
import type { Company } from "@/lib/types";
import CompanyModal from "./CompanyModal";

interface CustomerSelectProps {
  companies: Company[];
  isLoading?: boolean;
  onSelect: (id: string) => void;
  onAddCompany: (company: Omit<Company, "id">) => void;
  onUpdateCompany: (id: string, company: Omit<Company, "id">) => void;
  onDeleteCompany: (id: string) => void;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border-2 border-border bg-surface p-4 sm:p-5">
      <div className="h-5 w-3/4 rounded bg-border" />
      <div className="mt-3 h-4 w-1/2 rounded bg-border/60" />
    </div>
  );
}

export default function CustomerSelect({
  companies,
  isLoading,
  onSelect,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
}: CustomerSelectProps) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col px-4 py-6 sm:px-6 sm:py-8">
      <h2 className="mb-6 text-center text-xl font-bold sm:text-2xl">
        Vyber odberateľa
      </h2>

      <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 lg:max-w-2xl lg:grid-cols-3">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {companies.map((company) => (
              <div
                key={company.id}
                className="group relative rounded-2xl border-2 border-border bg-surface shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
              >
                {/* Edit button */}
                <button
                  type="button"
                  onClick={() => setEditingCompany(company)}
                  className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-all hover:bg-border/30 hover:text-foreground max-lg:opacity-70 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                  aria-label={`Upraviť ${company.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                {/* Card select area */}
                <button
                  type="button"
                  onClick={() => onSelect(company.id)}
                  className="w-full p-4 text-left active:scale-[0.97] sm:p-5"
                >
                  <div className="text-base font-bold leading-tight sm:text-lg">
                    {company.name}
                  </div>
                  <div className="mt-1.5 text-xs text-muted leading-snug sm:text-sm">
                    {company.address || "Bez adresy"}
                  </div>
                </button>
              </div>
            ))}

            {/* Add company card */}
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-4 text-muted transition-all hover:border-accent/40 hover:text-foreground active:scale-[0.97] sm:p-5"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="mt-1 text-sm font-medium">Pridať firmu</span>
            </button>
          </>
        )}
      </div>

      {/* Edit modal */}
      <CompanyModal
        open={editingCompany !== null}
        onClose={() => setEditingCompany(null)}
        onSave={(data) => {
          if (editingCompany) {
            onUpdateCompany(editingCompany.id, data);
          }
          setEditingCompany(null);
        }}
        onDelete={
          editingCompany && companies.length > 1
            ? () => {
                onDeleteCompany(editingCompany.id);
                setEditingCompany(null);
              }
            : undefined
        }
        initialData={editingCompany}
      />

      {/* Add modal */}
      <CompanyModal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        onSave={(data) => {
          onAddCompany(data);
          setIsAdding(false);
        }}
        initialData={null}
      />
    </div>
  );
}
