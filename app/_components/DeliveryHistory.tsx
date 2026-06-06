"use client";

import { useState, useEffect } from "react";
import { formatEUR, formatDateSK } from "@/lib/formatting";
import type { HistoryEntry } from "@/lib/types";

async function fetchHistory(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch("/api/history");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default function DeliveryHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchHistory().then(setEntries);
  }, []);

  useEffect(() => {
    function handleRefresh() {
      fetchHistory().then(setEntries);
    }
    window.addEventListener("delivery-sent", handleRefresh);
    return () => window.removeEventListener("delivery-sent", handleRefresh);
  }, []);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl bg-surface p-4 shadow-md sm:p-5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-lg font-bold"
      >
        <span>História ({entries.length})</span>
        <span className="text-sm text-muted">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2">
          {entries.slice(0, 20).map((entry, i) => (
            <div
              key={`${entry.deliveryNumber}-${i}`}
              className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{entry.company}</span>
                  {entry.status === "failed" && (
                    <span className="shrink-0 rounded bg-danger/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-danger">
                      Neodoslané
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted">
                  {formatDateSK(entry.date)} · {entry.deliveryNumber} · {entry.quantity} ks
                  {entry.freeQuantity > 0 ? ` + ${entry.freeQuantity} grátis` : ""}
                </div>
              </div>
              <div className="ml-3 shrink-0 font-bold">
                {formatEUR(entry.totalWithVat)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
