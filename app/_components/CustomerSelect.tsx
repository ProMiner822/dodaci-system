"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Company, HistoryEntry } from "@/lib/types";
import { formatEUR, todayISO } from "@/lib/formatting";
import { INPUT_CLASSES, btn } from "@/lib/styles";
import CompanyModal from "./CompanyModal";

interface DayStat {
  count: number;
  quantity: number;
  total: number;
}

interface CustomerSelectProps {
  companies: Company[];
  isLoading?: boolean;
  onSelect: (id: string) => void;
  onAddCompany: (company: Omit<Company, "id">) => void;
  onUpdateCompany: (id: string, company: Omit<Company, "id">) => void;
  onDeleteCompany: (id: string) => void;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="min-w-0 flex-1 animate-pulse">
        <div className="h-4 w-2/5 rounded bg-border" />
        <div className="mt-2 h-3 w-3/5 rounded bg-border/60" />
      </div>
      <div className="h-4 w-12 animate-pulse rounded bg-border" />
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
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Today's deliveries, so a driver doing rounds sees route progress and never
  // double-delivers a stop.
  useEffect(() => {
    function load() {
      fetch("/api/history")
        .then((r) => (r.ok ? r.json() : []))
        .then((d: HistoryEntry[]) => setHistory(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
    load();
    window.addEventListener("delivery-sent", load);
    return () => window.removeEventListener("delivery-sent", load);
  }, []);

  const { byCompany, dayTotals } = useMemo(() => {
    const today = todayISO();
    const map = new Map<string, DayStat>();
    const totals: DayStat = { count: 0, quantity: 0, total: 0 };
    for (const e of history) {
      if (e.date !== today || e.status === "failed") continue;
      const cur = map.get(e.company) ?? { count: 0, quantity: 0, total: 0 };
      cur.count += 1;
      cur.quantity += e.quantity;
      cur.total += e.totalWithVat;
      map.set(e.company, cur);
      totals.count += 1;
      totals.quantity += e.quantity;
      totals.total += e.totalWithVat;
    }
    return { byCompany: map, dayTotals: totals };
  }, [history]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }, [companies, query]);

  const showSearch = companies.length > 6;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Vyber odberateľa
          </h2>
          {!isLoading && companies.length > 0 && (
            <span className="font-mono text-sm text-muted tabular-nums">
              {companies.length}
            </span>
          )}
        </div>

        {dayTotals.count > 0 && (
          <div className="reveal mt-3 flex items-center gap-3 border-y border-border py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Dnes
            </span>
            <span className="flex flex-1 items-center justify-end gap-2.5 font-mono text-sm tabular-nums sm:gap-3.5">
              <span className="text-muted">{dayTotals.count} DL</span>
              <span className="text-border-strong">·</span>
              <span className="text-muted">{dayTotals.quantity} ks</span>
              <span className="text-border-strong">·</span>
              <span className="font-bold text-foreground">{formatEUR(dayTotals.total)}</span>
            </span>
          </div>
        )}
      </div>

      {showSearch && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hľadať firmu alebo adresu…"
          className={`${INPUT_CLASSES} mb-4`}
          aria-label="Hľadať odberateľa"
        />
      )}

      {isLoading ? (
        <div className="divide-y divide-border border-y border-border">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : companies.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="font-semibold">Zatiaľ žiadni odberatelia</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            Pridajte prvú firmu, aby ste mohli vystaviť dodací list.
          </p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={`${btn.primary} mt-5 min-h-[44px] px-4`}
          >
            Pridať firmu
          </button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border border-y border-border">
            {filtered.map((company, i) => {
              const done = byCompany.get(company.name);
              return (
                <div
                  key={company.id}
                  className="group relative flex items-stretch reveal transition-colors hover:bg-surface-alt"
                  style={{ "--i": Math.min(i, 12) } as CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(company.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 pr-2 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:bg-accent-soft"
                  >
                    {/* status dot — quiet route progress down the list */}
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${done ? "bg-success" : "bg-border-strong/50"}`}
                      aria-hidden="true"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold leading-tight">
                        {company.name}
                      </span>
                      {done ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-success">
                          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="font-mono tabular-nums">{done.quantity} ks</span>
                          dnes
                        </span>
                      ) : (
                        <span className="mt-0.5 block truncate text-sm text-muted">
                          {company.address || "Bez adresy"}
                        </span>
                      )}
                    </span>

                    <span className="shrink-0 text-right leading-tight">
                      <span className="block font-mono text-sm font-semibold tabular-nums">
                        {formatEUR(company.priceWithVat)}
                      </span>
                      <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-muted">
                        / ks
                      </span>
                    </span>

                    {/* nudges in on hover (desktop) — pure delight, no clutter */}
                    <svg
                      className="h-4 w-4 shrink-0 -translate-x-1 text-border-strong opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 max-lg:hidden"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingCompany(company)}
                    className="flex w-10 shrink-0 items-center justify-center text-muted/40 transition-all hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:scale-90 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                    aria-label={`Upraviť ${company.name}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Žiadna firma nezodpovedá „{query}“.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong text-sm font-bold text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Pridať firmu
          </button>
        </>
      )}

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
