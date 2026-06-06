"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import HistoryRow from "./HistoryRow";
import type { HistoryEntry } from "@/lib/types";

// `company` scopes the list to one customer (the detail screen). Without it the
// list is global (currently unused, but keeps the component reusable).
interface DeliveryHistoryProps {
  company?: string;
}

async function fetchHistory(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch("/api/history");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default function DeliveryHistory({ company }: DeliveryHistoryProps) {
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

  // On a customer's detail screen, show only that customer's deliveries.
  const visible = useMemo(
    () => (company ? entries.filter((e) => e.company === company) : entries),
    [entries, company],
  );

  if (visible.length === 0) return null;

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[52px] w-full items-center justify-between px-4 text-sm font-bold uppercase tracking-wide text-muted transition-colors hover:text-foreground"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          {company ? "História odberateľa" : "História"}
          <span className="font-mono text-xs tabular-nums">{visible.length}</span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="divide-y divide-border border-t border-border px-4">
          {visible.slice(0, 20).map((entry, i) => (
            <HistoryRow key={`${entry.deliveryNumber}-${i}`} entry={entry} />
          ))}
          <Link
            href="/archiv"
            className="block py-3 text-center text-sm font-bold text-accent transition-colors hover:bg-accent-soft"
          >
            Zobraziť celú históriu a súhrn →
          </Link>
        </div>
      )}
    </div>
  );
}
