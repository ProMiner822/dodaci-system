"use client";

import { useState } from "react";
import { formatEUR, formatDateSK } from "@/lib/formatting";
import { useToast } from "./Toast";
import type { HistoryEntry } from "@/lib/types";

export default function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const { addToast } = useToast();
  const [resending, setResending] = useState(false);
  const pdfUrl = `/api/delivery/${encodeURIComponent(entry.deliveryNumber)}/pdf`;

  async function handleResend() {
    if (!window.confirm(`Znova odoslať dodací list ${entry.deliveryNumber} na ${entry.company}?`)) {
      return;
    }
    setResending(true);
    try {
      const res = await fetch(`/api/delivery/${encodeURIComponent(entry.deliveryNumber)}/resend`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        addToast("Dodací list bol znova odoslaný.", "success");
      } else if (res.status === 404) {
        addToast("Pôvodný dodací list nie je dostupný na opätovné odoslanie.", "error");
      } else {
        addToast("Opätovné odoslanie zlyhalo.", "error");
      }
    } catch {
      addToast("Opätovné odoslanie zlyhalo.", "error");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="rounded-lg bg-surface-alt px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-3">
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
        <div className="ml-3 shrink-0 font-bold">{formatEUR(entry.totalWithVat)}</div>
      </div>

      <div className="mt-2 flex gap-2">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[36px] flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-center text-xs font-bold transition-colors hover:bg-border/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Stiahnuť PDF
        </a>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="min-h-[36px] flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-bold transition-colors hover:bg-border/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
        >
          {resending ? "Odosielam…" : "Znova odoslať"}
        </button>
      </div>
    </div>
  );
}
