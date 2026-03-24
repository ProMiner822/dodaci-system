import { put, head, list } from "@vercel/blob";
import type { Company } from "./types";

const COMPANIES_KEY = "dodaci-system/companies.json";
const HISTORY_KEY = "dodaci-system/history.json";

export interface HistoryEntry {
  deliveryNumber: string;
  date: string;
  company: string;
  quantity: number;
  freeQuantity: number;
  totalWithVat: number;
  sentAt: string;
}

// --- Companies ---

export async function getCompanies(): Promise<Company[]> {
  try {
    const blob = await head(COMPANIES_KEY);
    const res = await fetch(blob.url);
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveCompanies(companies: Company[]): Promise<void> {
  await put(COMPANIES_KEY, JSON.stringify(companies), {
    access: "public",
    addRandomSuffix: false,
  });
}

// --- History ---

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const blob = await head(HISTORY_KEY);
    const res = await fetch(blob.url);
    return await res.json();
  } catch {
    return [];
  }
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const history = await getHistory();
  history.unshift(entry);
  await put(HISTORY_KEY, JSON.stringify(history.slice(0, 100)), {
    access: "public",
    addRandomSuffix: false,
  });
}

// --- Delivery Counter ---

const COUNTER_KEY = "dodaci-system/counter.json";

interface CounterData {
  date: string;
  count: number;
}

export async function nextDeliveryNumber(): Promise<string> {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const dateKey = `${y}${m}${d}`;

  let counter: CounterData = { date: dateKey, count: 0 };
  try {
    const blob = await head(COUNTER_KEY);
    const res = await fetch(blob.url);
    counter = await res.json();
  } catch {
    // First time — start fresh
  }

  const nextCount = counter.date === dateKey ? counter.count + 1 : 1;

  await put(COUNTER_KEY, JSON.stringify({ date: dateKey, count: nextCount }), {
    access: "public",
    addRandomSuffix: false,
  });

  return `DL-${dateKey}-${String(nextCount).padStart(3, "0")}`;
}
