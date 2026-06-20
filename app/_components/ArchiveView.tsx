"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HistoryRow from "./HistoryRow";
import { formatEUR } from "@/lib/formatting";
import { INPUT_CLASSES, btn } from "@/lib/styles";
import {
  availableMonths,
  availableWeeks,
  filterEntries,
  monthOf,
  summarizeByCustomer,
  summaryToCSV,
  weekLabel,
  weekOf,
  type CustomerSummary,
} from "@/lib/history-utils";
import type { HistoryEntry } from "@/lib/types";

export default function ArchiveView() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
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
        const weeks = availableWeeks(data);
        if (weeks[0]) setWeek(weeks[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => availableMonths(entries), [entries]);
  const weeks = useMemo(() => availableWeeks(entries), [entries]);

  const monthEntries = useMemo(
    () => entries.filter((e) => monthOf(e.date) === month),
    [entries, month],
  );
  const monthSummaries = useMemo(() => summarizeByCustomer(monthEntries), [monthEntries]);
  const monthTotal = useMemo(
    () => monthSummaries.reduce((s, c) => s + c.totalWithVat, 0),
    [monthSummaries],
  );

  const weekEntries = useMemo(
    () => entries.filter((e) => weekOf(e.date) === week),
    [entries, week],
  );
  const weekSummaries = useMemo(() => summarizeByCustomer(weekEntries), [weekEntries]);
  const weekTotal = useMemo(
    () => weekSummaries.reduce((s, c) => s + c.totalWithVat, 0),
    [weekSummaries],
  );

  const filtered = useMemo(
    () => filterEntries(entries, { query, from, to }),
    [entries, query, from, to],
  );

  function exportCSV(
    summaries: CustomerSummary[],
    period: string,
    periodName: string,
    filename: string,
  ) {
    const csv = summaryToCSV(summaries, period, periodName);
    // Prepend BOM so Slovak Excel detects UTF-8.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
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
          <SummarySection
            title="Týždenný súhrn"
            value={week}
            options={weeks}
            getOptionLabel={weekLabel}
            onChange={setWeek}
            ariaLabel="Týždeň"
            emptyText="Žiadne dodacie listy v tomto týždni."
            summaries={weekSummaries}
            total={weekTotal}
            onExport={() =>
              exportCSV(
                weekSummaries,
                weekLabel(week),
                "týždeň",
                `suhrn-tyzden-${week}.csv`,
              )
            }
          />

          <SummarySection
            title="Mesačný súhrn"
            value={month}
            options={months}
            onChange={setMonth}
            ariaLabel="Mesiac"
            emptyText="Žiadne dodacie listy v tomto mesiaci."
            summaries={monthSummaries}
            total={monthTotal}
            onExport={() => exportCSV(monthSummaries, month, "mesiac", `suhrn-${month}.csv`)}
          />

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

interface SummarySectionProps {
  title: string;
  value: string;
  options: string[];
  getOptionLabel?: (value: string) => string;
  onChange: (value: string) => void;
  ariaLabel: string;
  emptyText: string;
  summaries: CustomerSummary[];
  total: number;
  onExport: () => void;
}

function SummarySection({
  title,
  value,
  options,
  getOptionLabel = (option) => option,
  onChange,
  ariaLabel,
  emptyText,
  summaries,
  total,
  onExport,
}: SummarySectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          {title}
        </h2>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded border border-border bg-surface-alt px-2 py-1.5 font-mono text-sm tabular-nums focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent/35"
          aria-label={ariaLabel}
        >
          {options.length === 0 ? (
            <option value="">-</option>
          ) : (
            options.map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))
          )}
        </select>
      </div>

      {summaries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{emptyText}</p>
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
                  <td className="py-2 pl-2 text-right">{formatEUR(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={onExport}
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
  );
}
