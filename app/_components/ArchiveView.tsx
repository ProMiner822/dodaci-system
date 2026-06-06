"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HistoryRow from "./HistoryRow";
import { formatEUR } from "@/lib/formatting";
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
    <main className="mx-auto w-full max-w-2xl px-4 py-5">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-bold hover:bg-border/30"
        >
          ← Späť
        </Link>
        <h1 className="text-xl font-bold">História a súhrn</h1>
      </div>

      {loading ? (
        <p className="text-muted">Načítavam…</p>
      ) : entries.length === 0 ? (
        <p className="text-muted">Zatiaľ žiadne dodacie listy.</p>
      ) : (
        <div className="space-y-5">
          {/* Monthly summary */}
          <section className="rounded-xl bg-surface p-4 shadow-md sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Mesačný súhrn</h2>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg border border-border bg-surface-alt px-2 py-1.5 text-sm"
                aria-label="Mesiac"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {summaries.length === 0 ? (
              <p className="text-sm text-muted">Žiadne dodacie listy v tomto mesiaci.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-muted">
                        <th className="py-1 pr-2 font-bold">Odberateľ</th>
                        <th className="py-1 px-2 text-right font-bold">DL</th>
                        <th className="py-1 px-2 text-right font-bold">ks</th>
                        <th className="py-1 pl-2 text-right font-bold">Suma s DPH</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaries.map((s) => (
                        <tr key={s.company} className="border-t border-border/50">
                          <td className="py-1.5 pr-2">{s.company}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums">{s.count}</td>
                          <td className="py-1.5 px-2 text-right tabular-nums">{s.totalQuantity}</td>
                          <td className="py-1.5 pl-2 text-right font-bold tabular-nums">
                            {formatEUR(s.totalWithVat)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border font-bold">
                        <td className="py-1.5 pr-2">Spolu</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">
                          {summaries.reduce((n, s) => n + s.count, 0)}
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums">
                          {summaries.reduce((n, s) => n + s.totalQuantity, 0)}
                        </td>
                        <td className="py-1.5 pl-2 text-right tabular-nums">{formatEUR(monthTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={exportCSV}
                  className="mt-3 min-h-[40px] w-full rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent/90"
                >
                  Exportovať CSV
                </button>
              </>
            )}
          </section>

          {/* Searchable list */}
          <section className="rounded-xl bg-surface p-4 shadow-md sm:p-5">
            <h2 className="mb-3 text-lg font-bold">Všetky dodacie listy</h2>
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hľadať odberateľa alebo číslo…"
                className="sm:col-span-2 min-h-[40px] rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-xs text-muted">
                Od
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="min-h-[40px] flex-1 rounded-lg border border-border bg-surface-alt px-2 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted">
                Do
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="min-h-[40px] flex-1 rounded-lg border border-border bg-surface-alt px-2 py-2 text-sm"
                />
              </label>
            </div>

            <p className="mb-2 text-xs text-muted">{filtered.length} záznamov</p>
            <div className="space-y-2">
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
