import type { DeliveryPayload } from "./types";

// Client-side outbox: when a send can't reach the server (offline), the signed
// delivery is queued in localStorage and flushed when connectivity returns, so
// a note is never lost in the field.

const KEY = "dodaci-system-outbox";

export interface QueuedSend {
  id: string;
  payload: DeliveryPayload;
  // True when the delivery number still needs to be committed (queued while
  // offline, so the counter couldn't be reached). Minted at flush time.
  needsNumber: boolean;
  queuedAt: string;
}

function read(): QueuedSend[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedSend[]) : [];
  } catch {
    return [];
  }
}

function write(queue: QueuedSend[]): void {
  localStorage.setItem(KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event("outbox-changed"));
}

export function getQueue(): QueuedSend[] {
  return read();
}

export function queueCount(): number {
  return read().length;
}

export function enqueue(payload: DeliveryPayload, needsNumber: boolean): void {
  const queue = read();
  queue.push({
    id: crypto.randomUUID(),
    payload,
    needsNumber,
    queuedAt: new Date().toISOString(),
  });
  write(queue);
}

let flushing = false;

// Try to send everything in the queue, oldest first. Stops at the first
// failure (likely still offline) and keeps the rest for the next attempt.
export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  flushing = true;
  try {
    while (true) {
      const queue = read();
      if (queue.length === 0) break;
      const item = queue[0];

      try {
        if (item.needsNumber) {
          const res = await fetch("/api/delivery-number", { method: "POST" });
          if (!res.ok) throw new Error("mint failed");
          const data = await res.json();
          item.payload = { ...item.payload, deliveryNumber: data.number };
          item.needsNumber = false;
          // Persist the committed number so a later retry never mints twice.
          write([item, ...queue.slice(1)]);
        }

        const res = await fetch("/api/send-delivery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error("send failed");

        // Success — drop the head and notify history to refresh.
        write(read().filter((q) => q.id !== item.id));
        window.dispatchEvent(new Event("delivery-sent"));
      } catch {
        break; // offline or server error; keep the queue and retry later
      }
    }
  } finally {
    flushing = false;
  }
}
