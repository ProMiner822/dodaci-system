"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HistoryRow from "./HistoryRow";
import { formatEUR } from "@/lib/formatting";
import { INPUT_CLASSES, btn } from "@/lib/styles";
import {
  availableMonths,
  filterEntries,
  monthOf,
  summarizeByCustomer,
  summaryToCSV,
} from "@/lib/history-utils";
import type { HistoryEntry } from "@/lib/types";

export default function ArchiveView() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetch("/api/history")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: HistoryEntry[]) => {
        setEntries(data);
        const months = availableMonths(data);
        if (months[0]) setMonth(months[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => availableMonths(entries), [entries]);

  const monthEntries = useMemo(
    () => entries.filter((e) => monthOf(e.date) === month),
    [entries, month],
  );
  const summaries = useMemo(() => summarizeByCustomer(monthEntries), [monthEntries]);
  const monthTotal = useMemo(
    () => summaries.reduce((s, c) => s + c.totalWithVat, 0),
    [summaries],
  );

  const filtered = useMemo(
    () => filterEntries(entries, { query, from, to }),
    [entries, query, from, to],
  );

  function exportCSV() {
    const csv = summaryToCSV(summaries, month);
    // Prepend BOM so Slovak Excel detects UTF-8.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suhrn-${month}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-5 sm:py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          className={`${btn.secondary} px-3 py-2 text-sm`}
          aria-label="Späť"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Späť
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight">História a súhrn</h1>
      </div>

      {loading ? (
        <div className="divide-y divide-border border-y border-border">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-surface-alt/50" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="font-semibold">Zatiaľ žiadne dodacie listy</p>
          <p className="mt-1 text-sm text-muted">Odoslané dodacie listy sa zobrazia tu.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Monthly summary */}
          <section>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
                Mesačný súhrn
              </h2>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded border border-border bg-surface-alt px-2 py-1.5 font-mono text-sm tabular-nums focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent/35"
                aria-label="Mesiac"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {summaries.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Žiadne dodacie listy v tomto mesiaci.
              </p>
            ) : (
              <div className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                        <th className="py-1.5 pr-2 font-bold">Odberateľ</th>
                        <th className="py-1.5 px-2 text-right font-bold">DL</th>
                        <th className="py-1.5 px-2 text-right font-bold">ks</th>
                        <th className="py-1.5 pl-2 text-right font-bold">Suma s DPH</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono tabular-nums">
                      {summaries.map((s) => (
                        <tr key={s.company} className="border-t border-border">
                          <td className="py-2 pr-2 font-sans font-semibold">{s.company}</td>
                          <td className="py-2 px-2 text-right">{s.count}</td>
                          <td className="py-2 px-2 text-right">{s.totalQuantity}</td>
                          <td className="py-2 pl-2 text-right font-bold">
                            {formatEUR(s.totalWithVat)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border-strong font-bold">
                        <td className="py-2 pr-2 font-sans">Spolu</td>
                        <td className="py-2 px-2 text-right">
                          {summaries.reduce((n, s) => n + s.count, 0)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {summaries.reduce((n, s) => n + s.totalQuantity, 0)}
                        </td>
                        <td className="py-2 pl-2 text-right">{formatEUR(monthTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={exportCSV}
                  className={`${btn.secondary} mt-4 min-h-[44px] w-full text-sm`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Exportovať CSV
                </button>
              </div>
            )}
          </section>

          {/* Searchable list */}
          <section>
            <h2 className="mb-3 border-b border-border pb-3 text-sm font-bold uppercase tracking-wide text-muted">
              Všetky dodacie listy
            </h2>
            <div className="mb-3 space-y-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hľadať odberateľa alebo číslo…"
                className={INPUT_CLASSES}
              />
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                  Od
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className={`${INPUT_CLASSES} font-mono`}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                  Do
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={`${INPUT_CLASSES} font-mono`}
                  />
                </label>
              </div>
            </div>

            <p className="mb-1 font-mono text-xs text-muted tabular-nums">
              {filtered.length} záznamov
            </p>
            <div className="divide-y divide-border border-t border-border">
              {filtered.map((entry, i) => (
                <HistoryRow key={`${entry.deliveryNumber}-${i}`} entry={entry} />
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
