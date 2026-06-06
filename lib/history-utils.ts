import type { HistoryEntry } from "./types";

// All helpers here are pure so they can be unit-tested without the Blob store.

export interface CustomerSummary {
  company: string;
  count: number;
  totalQuantity: number;
  totalFree: number;
  totalWithVat: number;
}

// YYYY-MM from a YYYY-MM-DD date string.
export function monthOf(dateISO: string): string {
  return dateISO.slice(0, 7);
}

// Distinct months present in the history, newest first.
export function availableMonths(entries: HistoryEntry[]): string[] {
  const set = new Set<string>();
  for (const e of entries) if (e.date) set.add(monthOf(e.date));
  return [...set].sort().reverse();
}

// Per-customer totals for a set of entries (only successful sends count).
export function summarizeByCustomer(entries: HistoryEntry[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const e of entries) {
    if (e.status === "failed") continue;
    const s =
      map.get(e.company) ??
      { company: e.company, count: 0, totalQuantity: 0, totalFree: 0, totalWithVat: 0 };
    s.count += 1;
    s.totalQuantity += e.quantity;
    s.totalFree += e.freeQuantity;
    s.totalWithVat += e.totalWithVat;
    map.set(e.company, s);
  }
  return [...map.values()].sort((a, b) => b.totalWithVat - a.totalWithVat);
}

export interface HistoryFilter {
  query?: string; // matches company or delivery number
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
}

export function filterEntries(entries: HistoryEntry[], f: HistoryFilter): HistoryEntry[] {
  const q = f.query?.trim().toLowerCase();
  return entries.filter((e) => {
    if (q) {
      const hay = `${e.company} ${e.deliveryNumber}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.from && e.date < f.from) return false;
    if (f.to && e.date > f.to) return false;
    return true;
  });
}

// SK-friendly CSV: semicolon separator, comma decimals (opens cleanly in
// Slovak Excel). Includes a totals row.
export function summaryToCSV(summaries: CustomerSummary[], month: string): string {
  const num = (n: number) => n.toFixed(2).replace(".", ",");
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows: string[] = [];
  rows.push(`Súhrn za mesiac;${month}`);
  rows.push("Odberateľ;Počet DL;Počet ks;Grátis ks;Suma s DPH (EUR)");
  let dl = 0, ks = 0, free = 0, total = 0;
  for (const s of summaries) {
    rows.push(`${esc(s.company)};${s.count};${s.totalQuantity};${s.totalFree};${num(s.totalWithVat)}`);
    dl += s.count; ks += s.totalQuantity; free += s.totalFree; total += s.totalWithVat;
  }
  rows.push(`Spolu;${dl};${ks};${free};${num(total)}`);
  return rows.join("\r\n");
}
