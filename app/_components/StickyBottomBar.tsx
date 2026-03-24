"use client";

import { formatEUR } from "@/lib/formatting";

interface StickyBottomBarProps {
  quantity: number;
  freeQuantity: number;
  totalWithVat: number;
  onSend: () => void;
  canSend: boolean;
}

export default function StickyBottomBar({
  quantity,
  freeQuantity,
  totalWithVat,
  onSend,
  canSend,
}: StickyBottomBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_10px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="flex h-16 items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted">
            {quantity} ks{freeQuantity > 0 ? ` + ${freeQuantity} grátis` : ""}
          </div>
          <div className="text-lg font-bold leading-tight">{formatEUR(totalWithVat)}</div>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-5 font-bold text-white shadow-sm transition-colors hover:bg-accent-hover active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Odoslať
        </button>
      </div>
    </div>
  );
}
