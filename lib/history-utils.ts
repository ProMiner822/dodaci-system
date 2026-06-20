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

// ISO week (Monday-Sunday) as YYYY-Www from a YYYY-MM-DD date string.
export function weekOf(dateISO: string): string {
  const date = new Date(`${dateISO}T00:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// Distinct months present in the history, newest first.
export function availableMonths(entries: HistoryEntry[]): string[] {
  const set = new Set<string>();
  for (const e of entries) if (e.date) set.add(monthOf(e.date));
  return [...set].sort().reverse();
}

// Distinct ISO weeks present in the history, newest first.
export function availableWeeks(entries: HistoryEntry[]): string[] {
  const set = new Set<string>();
  for (const e of entries) if (e.date) set.add(weekOf(e.date));
  return [...set].sort().reverse();
}

export function weekLabel(weekISO: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekISO);
  if (!match) return weekISO;

  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const fmt = new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
  });
  return `${week}. týždeň (${fmt.format(monday)} - ${fmt.format(sunday)})`;
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
export function summaryToCSV(
  summaries: CustomerSummary[],
  period: string,
  periodName = "mesiac",
): string {
  const num = (n: number) => n.toFixed(2).replace(".", ",");
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows: string[] = [];
  rows.push(`Súhrn za ${periodName};${period}`);
  rows.push("Odberateľ;Počet DL;Počet ks;Grátis ks;Suma s DPH (EUR)");
  let dl = 0, ks = 0, free = 0, total = 0;
  for (const s of summaries) {
    rows.push(`${esc(s.company)};${s.count};${s.totalQuantity};${s.totalFree};${num(s.totalWithVat)}`);
    dl += s.count; ks += s.totalQuantity; free += s.totalFree; total += s.totalWithVat;
  }
  rows.push(`Spolu;${dl};${ks};${free};${num(total)}`);
  return rows.join("\r\n");
}
