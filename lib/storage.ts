import { put, head } from "@vercel/blob";
import type { Company, DeliveryPayload, HistoryEntry } from "./types";

export type { HistoryEntry };

const COMPANIES_KEY = "dodaci-system/companies.json";
const HISTORY_KEY = "dodaci-system/history.json";
const HISTORY_LIMIT = 2000;

async function readBlob<T>(key: string): Promise<T | null> {
  const blob = await head(key);
  const res = await fetch(blob.url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// --- Companies ---

export async function getCompanies(): Promise<Company[]> {
  try {
    return (await readBlob<Company[]>(COMPANIES_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function saveCompanies(companies: Company[]): Promise<void> {
  await put(COMPANIES_KEY, JSON.stringify(companies), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// --- History ---

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    return (await readBlob<HistoryEntry[]>(HISTORY_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const history = await getHistory();
  history.unshift(entry);
  await put(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

// Most recent successful delivery for a customer (history is newest-first).
// Legacy entries predate the status field, so treat anything not "failed" as
// sent — matching summarizeByCustomer.
export async function lastSentForCompany(company: string): Promise<HistoryEntry | null> {
  const history = await getHistory();
  return history.find((e) => e.company === company && e.status !== "failed") ?? null;
}

// --- Per-delivery full payload (for re-send / download) ---

function deliveryKey(deliveryNumber: string): string {
  // deliveryNumber is already DL-YYYYMMDD-NNN (blob-safe); guard anyway.
  return `dodaci-system/deliveries/${deliveryNumber.replace(/[^a-zA-Z0-9\-]/g, "")}.json`;
}

export async function saveDelivery(payload: DeliveryPayload): Promise<void> {
  await put(deliveryKey(payload.deliveryNumber), JSON.stringify(payload), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function getDelivery(deliveryNumber: string): Promise<DeliveryPayload | null> {
  try {
    return await readBlob<DeliveryPayload>(deliveryKey(deliveryNumber));
  } catch {
    return null;
  }
}

// --- Delivery Counter ---

const COUNTER_KEY = "dodaci-system/counter.json";

interface CounterData {
  date: string;
  count: number;
}

// Date key in Slovak time (server runs UTC) so the number's date matches the
// document date, which also uses Europe/Bratislava.
function dateKeySK(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" })
    .format(new Date())
    .replace(/-/g, "");
}

async function readCounter(dateKey: string): Promise<CounterData> {
  try {
    return (await readBlob<CounterData>(COUNTER_KEY)) ?? { date: dateKey, count: 0 };
  } catch {
    return { date: dateKey, count: 0 };
  }
}

function formatDeliveryNumber(dateKey: string, count: number): string {
  return `DL-${dateKey}-${String(count).padStart(3, "0")}`;
}

// Peek the next number for display WITHOUT incrementing — so loading or
// abandoning a form never burns a number.
export async function peekDeliveryNumber(): Promise<string> {
  const dateKey = dateKeySK();
  const counter = await readCounter(dateKey);
  const nextCount = counter.date === dateKey ? counter.count + 1 : 1;
  return formatDeliveryNumber(dateKey, nextCount);
}

// Commit the next number: increment the counter and return it. Called only at
// send time, so the sequence has no gaps from abandoned forms.
export async function nextDeliveryNumber(): Promise<string> {
  const dateKey = dateKeySK();
  const counter = await readCounter(dateKey);
  const nextCount = counter.date === dateKey ? counter.count + 1 : 1;
  await put(COUNTER_KEY, JSON.stringify({ date: dateKey, count: nextCount }), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return formatDeliveryNumber(dateKey, nextCount);
}
