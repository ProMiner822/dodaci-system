"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HistoryRow from "./HistoryRow";
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
            <HistoryRow key={`${entry.deliveryNumber}-${i}`} entry={entry} />
          ))}
          <Link
            href="/archiv"
            className="block rounded-lg px-3 py-2 text-center text-sm font-bold text-accent hover:underline"
          >
            Zobraziť celú históriu a súhrn →
          </Link>
        </div>
      )}
    </div>
  );
}
