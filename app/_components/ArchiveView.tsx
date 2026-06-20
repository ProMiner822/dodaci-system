"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HistoryRow from "./HistoryRow";
import { formatDateSK, formatEUR } from "@/lib/formatting";
import { INPUT_CLASSES, btn } from "@/lib/styles";
import {
  availableMonths,
  availableWeeks,
  filterEntries,
  monthOf,
  monthRange,
  summarizeByCustomer,
  summaryToCSV,
  weekLabel,
  weekOf,
  weekRange,
  type CustomerSummary,
} from "@/lib/history-utils";
import type { HistoryEntry } from "@/lib/types";

type ReportMode = "week" | "month" | "custom";
type HistoryStatusFilter = "all" | "failed";

interface SummaryTotals {
  count: number;
  totalQuantity: number;
  totalFree: number;
  totalWithVat: number;
}

const SELECT_CLASSES =
  "min-h-[44px] rounded border border-border bg-surface-alt px-3 py-2 font-mono text-sm text-foreground tabular-nums focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-accent/35";

const reportModes: Array<{ mode: ReportMode; label: string }> = [
  { mode: "week", label: "Týždeň" },
  { mode: "month", label: "Mesiac" },
  { mode: "custom", label: "Vlastné" },
];

const intFormatter = new Intl.NumberFormat("sk-SK");

function formatInt(value: number): string {
  return intFormatter.format(value || 0);
}

function totalsFromSummaries(summaries: CustomerSummary[]): SummaryTotals {
  return summaries.reduce(
    (total, summary) => ({
      count: total.count + summary.count,
      totalQuantity: total.totalQuantity + summary.totalQuantity,
      totalFree: total.totalFree + summary.totalFree,
      totalWithVat: total.totalWithVat + summary.totalWithVat,
    }),
    { count: 0, totalQuantity: 0, totalFree: 0, totalWithVat: 0 },
  );
}

function customRangeLabel(from: string, to: string): string {
  if (from && to) return `${formatDateSK(from)} - ${formatDateSK(to)}`;
  if (from) return `Od ${formatDateSK(from)}`;
  if (to) return `Do ${formatDateSK(to)}`;
  return "Všetky záznamy";
}

function groupEntriesByDate(entries: HistoryEntry[]): Array<{ date: string; entries: HistoryEntry[] }> {
  const groups = new Map<string, HistoryEntry[]>();
  for (const entry of entries) {
    const dateEntries = groups.get(entry.date) ?? [];
    dateEntries.push(entry);
    groups.set(entry.date, dateEntries);
  }
  return [...groups.entries()].map(([date, dateEntries]) => ({ date, entries: dateEntries }));
}

function chipClass(active = false): string {
  return [
    "min-h-[40px] rounded border px-3 py-2 text-xs font-bold",
    "transition-[background-color,border-color,color,transform,opacity] duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "active:scale-[0.96] disabled:pointer-events-none disabled:opacity-45",
    active
      ? "border-accent bg-accent text-accent-ink shadow-[var(--elev-amber)]"
      : "border-border bg-surface text-muted hover:border-border-strong hover:bg-surface-alt hover:text-foreground",
  ].join(" ");
}

export default function ArchiveView() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [reportMode, setReportMode] = useState<ReportMode>("week");
  const [month, setMonth] = useState("");
  const [week, setWeek] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>("all");

  useEffect(() => {
    fetch("/api/history")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: HistoryEntry[]) => {
        const months = availableMonths(data);
        const weeks = availableWeeks(data);
        const params = new URLSearchParams(window.location.search);
        const requestedMode = params.get("period");
        const requestedWeek = params.get("week");
        const requestedMonth = params.get("month");
        const requestedStatus = params.get("status");

        setEntries(data);
        setWeek(requestedWeek && weeks.includes(requestedWeek) ? requestedWeek : weeks[0] ?? "");
        setMonth(
          requestedMonth && months.includes(requestedMonth) ? requestedMonth : months[0] ?? "",
        );
        setCustomFrom(params.get("customFrom") ?? "");
        setCustomTo(params.get("customTo") ?? "");
        setQuery(params.get("q") ?? "");
        setFrom(params.get("from") ?? "");
        setTo(params.get("to") ?? "");
        setStatusFilter(requestedStatus === "failed" ? "failed" : "all");
        setReportMode(
          requestedMode === "month" || requestedMode === "custom" ? requestedMode : "week",
        );
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setInitialized(true);
      });
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const params = new URLSearchParams();
    params.set("period", reportMode);
    if (reportMode === "week" && week) params.set("week", week);
    if (reportMode === "month" && month) params.set("month", month);
    if (reportMode === "custom") {
      if (customFrom) params.set("customFrom", customFrom);
      if (customTo) params.set("customTo", customTo);
    }
    if (query) params.set("q", query);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (statusFilter === "failed") params.set("status", statusFilter);

    const queryString = params.toString();
    window.history.replaceState(null, "", queryString ? `/archiv?${queryString}` : "/archiv");
  }, [customFrom, customTo, from, initialized, month, query, reportMode, statusFilter, to, week]);

  const months = useMemo(() => availableMonths(entries), [entries]);
  const weeks = useMemo(() => availableWeeks(entries), [entries]);
  const latestWeekRange = useMemo(() => weekRange(weeks[0] ?? ""), [weeks]);
  const latestMonthRange = useMemo(() => monthRange(months[0] ?? ""), [months]);

  const reportEntries = useMemo(() => {
    if (reportMode === "month") {
      return entries.filter((entry) => monthOf(entry.date) === month);
    }
    if (reportMode === "custom") {
      return filterEntries(entries, { from: customFrom, to: customTo });
    }
    return entries.filter((entry) => weekOf(entry.date) === week);
  }, [customFrom, customTo, entries, month, reportMode, week]);

  const reportSummaries = useMemo(() => summarizeByCustomer(reportEntries), [reportEntries]);
  const reportTotals = useMemo(() => totalsFromSummaries(reportSummaries), [reportSummaries]);
  const failedInReport = useMemo(
    () => reportEntries.filter((entry) => entry.status === "failed").length,
    [reportEntries],
  );

  const reportPeriodLabel =
    reportMode === "month"
      ? month || "Mesiac"
      : reportMode === "custom"
        ? customRangeLabel(customFrom, customTo)
        : weekLabel(week);
  const reportPeriodName =
    reportMode === "month" ? "mesiac" : reportMode === "custom" ? "obdobie" : "týždeň";
  const reportFilePeriod =
    reportMode === "month"
      ? month
      : reportMode === "custom"
        ? `obdobie-${customFrom || "od"}-${customTo || "do"}`
        : `tyzden-${week}`;

  const filtered = useMemo(() => {
    const dateFiltered = filterEntries(entries, { query, from, to });
    if (statusFilter === "failed") {
      return dateFiltered.filter((entry) => entry.status === "failed");
    }
    return dateFiltered;
  }, [entries, from, query, statusFilter, to]);

  const groupedHistory = useMemo(() => groupEntriesByDate(filtered), [filtered]);
  const failedCount = useMemo(
    () => entries.filter((entry) => entry.status === "failed").length,
    [entries],
  );
  const hasHistoryFilters = Boolean(query || from || to || statusFilter !== "all");
  const isLatestWeekActive = Boolean(
    latestWeekRange && from === latestWeekRange.from && to === latestWeekRange.to,
  );
  const isLatestMonthActive = Boolean(
    latestMonthRange && from === latestMonthRange.from && to === latestMonthRange.to,
  );

  function exportCSV() {
    const csv = summaryToCSV(reportSummaries, reportPeriodLabel, reportPeriodName);
    // Prepend BOM so Slovak Excel detects UTF-8.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suhrn-${reportFilePeriod || reportMode}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function applyHistoryRange(range: { from: string; to: string } | null) {
    if (!range) return;
    setFrom(range.from);
    setTo(range.to);
  }

  function clearHistoryFilters() {
    setQuery("");
    setFrom("");
    setTo("");
    setStatusFilter("all");
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-5 sm:py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className={`${btn.secondary} min-h-[40px] px-3 py-2 text-sm`}
          aria-label="Späť"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Späť
        </Link>
        <div className="min-w-0">
          <h1 className="text-balance text-xl font-extrabold tracking-tight">
            História a súhrn
          </h1>
          <p className="mt-0.5 text-pretty text-sm text-muted">
            Prehľad odoslaných dodacích listov a export pre účtovníctvo.
          </p>
        </div>
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
        <div className="space-y-10">
          <section aria-labelledby="summary-title" className="space-y-4">
            <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Súhrn</p>
                <h2 id="summary-title" className="mt-1 text-balance text-2xl font-extrabold">
                  {reportPeriodLabel}
                </h2>
                {failedInReport > 0 && (
                  <p className="mt-1 text-sm font-semibold text-danger">
                    {formatInt(failedInReport)} neodoslané DL nie sú v súčte.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={exportCSV}
                disabled={reportSummaries.length === 0}
                className={`${btn.secondary} min-h-[44px] px-4 text-sm`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportovať súhrn CSV
              </button>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div
                role="tablist"
                aria-label="Typ súhrnu"
                className="grid grid-cols-3 rounded bg-surface-alt p-1 shadow-[inset_0_0_0_1px_var(--border)] sm:w-fit"
              >
                {reportModes.map(({ mode, label }) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={reportMode === mode}
                    onClick={() => setReportMode(mode)}
                    className={[
                      "min-h-[38px] rounded-sm px-3 text-sm font-bold",
                      "transition-[background-color,color,box-shadow,transform] duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      "active:scale-[0.96]",
                      reportMode === mode
                        ? "bg-surface text-foreground shadow-[var(--elev-1)]"
                        : "text-muted hover:text-foreground",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <ReportControls
                mode={reportMode}
                week={week}
                weeks={weeks}
                month={month}
                months={months}
                customFrom={customFrom}
                customTo={customTo}
                onWeekChange={setWeek}
                onMonthChange={setMonth}
                onCustomFromChange={setCustomFrom}
                onCustomToChange={setCustomTo}
              />
            </div>

            <SummaryMetrics totals={reportTotals} />

            {reportSummaries.length === 0 ? (
              <p className="border-y border-border py-8 text-center text-sm text-muted">
                Žiadne odoslané dodacie listy v tomto období.
              </p>
            ) : (
              <SummaryTable summaries={reportSummaries} totals={reportTotals} />
            )}
          </section>

          <section aria-labelledby="history-title">
            <div className="mb-3 flex flex-col gap-1 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="history-title"
                  className="text-sm font-bold uppercase tracking-wide text-muted"
                >
                  Všetky dodacie listy
                </h2>
                <p className="mt-1 font-mono text-xs text-muted tabular-nums">
                  {formatInt(filtered.length)} z {formatInt(entries.length)} záznamov
                </p>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <input
                type="search"
                name="history-query"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hľadať odberateľa alebo číslo…"
                aria-label="Hľadať v histórii"
                className={INPUT_CLASSES}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                  Od
                  <input
                    type="date"
                    name="history-from"
                    autoComplete="off"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className={`${INPUT_CLASSES} font-mono`}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                  Do
                  <input
                    type="date"
                    name="history-to"
                    autoComplete="off"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={`${INPUT_CLASSES} font-mono`}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2" aria-label="Rýchle filtre">
                <button
                  type="button"
                  onClick={() => applyHistoryRange(latestWeekRange)}
                  disabled={!latestWeekRange}
                  className={chipClass(isLatestWeekActive)}
                >
                  Najnovší týždeň
                </button>
                <button
                  type="button"
                  onClick={() => applyHistoryRange(latestMonthRange)}
                  disabled={!latestMonthRange}
                  className={chipClass(isLatestMonthActive)}
                >
                  Najnovší mesiac
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStatusFilter(statusFilter === "failed" ? "all" : "failed")
                  }
                  disabled={failedCount === 0}
                  className={chipClass(statusFilter === "failed")}
                >
                  Neodoslané {failedCount > 0 ? `(${formatInt(failedCount)})` : ""}
                </button>
                {hasHistoryFilters && (
                  <button type="button" onClick={clearHistoryFilters} className={chipClass()}>
                    Vyčistiť filtre
                  </button>
                )}
              </div>
            </div>

            {groupedHistory.length === 0 ? (
              <p className="border-y border-border py-8 text-center text-sm text-muted">
                Žiadne záznamy nezodpovedajú filtrom.
              </p>
            ) : (
              <div className="divide-y divide-border border-y border-border">
                {groupedHistory.map((group) => (
                  <div key={group.date} className="py-2">
                    <div className="mb-1 flex items-center justify-between gap-3 font-mono text-[11px] font-bold uppercase tracking-wide text-muted tabular-nums">
                      <span>{formatDateSK(group.date)}</span>
                      <span>{formatInt(group.entries.length)} DL</span>
                    </div>
                    <div className="divide-y divide-border">
                      {group.entries.map((entry, i) => (
                        <HistoryRow
                          key={`${entry.deliveryNumber}-${i}`}
                          entry={entry}
                          showDate={false}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

interface ReportControlsProps {
  mode: ReportMode;
  week: string;
  weeks: string[];
  month: string;
  months: string[];
  customFrom: string;
  customTo: string;
  onWeekChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
}

function ReportControls({
  mode,
  week,
  weeks,
  month,
  months,
  customFrom,
  customTo,
  onWeekChange,
  onMonthChange,
  onCustomFromChange,
  onCustomToChange,
}: ReportControlsProps) {
  if (mode === "month") {
    return (
      <select
        value={month}
        onChange={(e) => onMonthChange(e.target.value)}
        className={`${SELECT_CLASSES} w-full sm:w-auto`}
        aria-label="Mesiac súhrnu"
      >
        {months.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (mode === "custom") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-muted">
          Od
          <input
            type="date"
            name="summary-from"
            autoComplete="off"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className={`${INPUT_CLASSES} font-mono`}
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted">
          Do
          <input
            type="date"
            name="summary-to"
            autoComplete="off"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className={`${INPUT_CLASSES} font-mono`}
          />
        </label>
      </div>
    );
  }

  return (
    <select
      value={week}
      onChange={(e) => onWeekChange(e.target.value)}
      className={`${SELECT_CLASSES} w-full sm:w-auto`}
      aria-label="Týždeň súhrnu"
    >
      {weeks.map((option) => (
        <option key={option} value={option}>
          {weekLabel(option)}
        </option>
      ))}
    </select>
  );
}

function SummaryMetrics({ totals }: { totals: SummaryTotals }) {
  const metrics = [
    { label: "Odoslané DL", value: formatInt(totals.count) },
    { label: "Počet ks", value: formatInt(totals.totalQuantity) },
    { label: "Grátis ks", value: formatInt(totals.totalFree) },
    { label: "Suma s DPH", value: formatEUR(totals.totalWithVat) },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded border border-border bg-surface px-3 py-3 shadow-[var(--elev-1)]"
        >
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">
            {metric.label}
          </div>
          <div className="mt-1 truncate font-mono text-xl font-extrabold tabular-nums">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryTable({
  summaries,
  totals,
}: {
  summaries: CustomerSummary[];
  totals: SummaryTotals;
}) {
  return (
    <>
      <div className="divide-y divide-border border-y border-border sm:hidden">
        {summaries.map((summary) => (
          <div key={summary.company} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 font-semibold">{summary.company}</div>
              <div className="shrink-0 font-mono font-bold tabular-nums">
                {formatEUR(summary.totalWithVat)}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs tabular-nums text-muted">
              <span>{formatInt(summary.count)} DL</span>
              <span>{formatInt(summary.totalQuantity)} ks</span>
              <span>{formatInt(summary.totalFree)} grátis</span>
            </div>
          </div>
        ))}
        <div className="py-3 font-bold">
          <div className="flex items-start justify-between gap-3">
            <span>Spolu</span>
            <span className="font-mono tabular-nums">{formatEUR(totals.totalWithVat)}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs tabular-nums">
            <span>{formatInt(totals.count)} DL</span>
            <span>{formatInt(totals.totalQuantity)} ks</span>
            <span>{formatInt(totals.totalFree)} grátis</span>
          </div>
        </div>
      </div>

      <div className="hidden overflow-x-auto border-y border-border sm:block">
        <table className="w-full min-w-[38rem] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-2 font-bold">Odberateľ</th>
              <th className="py-2 px-2 text-right font-bold">DL</th>
              <th className="py-2 px-2 text-right font-bold">ks</th>
              <th className="py-2 px-2 text-right font-bold">Grátis</th>
              <th className="py-2 pl-2 text-right font-bold">Suma s DPH</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {summaries.map((summary) => (
              <tr key={summary.company} className="border-t border-border">
                <td className="max-w-[18rem] break-words py-2 pr-2 font-sans font-semibold">
                  {summary.company}
                </td>
                <td className="py-2 px-2 text-right">{formatInt(summary.count)}</td>
                <td className="py-2 px-2 text-right">{formatInt(summary.totalQuantity)}</td>
                <td className="py-2 px-2 text-right">{formatInt(summary.totalFree)}</td>
                <td className="py-2 pl-2 text-right font-bold">
                  {formatEUR(summary.totalWithVat)}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border-strong font-bold">
              <td className="py-2 pr-2 font-sans">Spolu</td>
              <td className="py-2 px-2 text-right">{formatInt(totals.count)}</td>
              <td className="py-2 px-2 text-right">{formatInt(totals.totalQuantity)}</td>
              <td className="py-2 px-2 text-right">{formatInt(totals.totalFree)}</td>
              <td className="py-2 pl-2 text-right">{formatEUR(totals.totalWithVat)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
