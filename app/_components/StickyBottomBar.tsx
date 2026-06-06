"use client";

import { formatEUR } from "@/lib/formatting";
import { btn } from "@/lib/styles";

interface StickyBottomBarProps {
  quantity: number;
  freeQuantity: number;
  totalWithVat: number;
  onReview: () => void;
  onSign: () => void;
  hasSignature: boolean;
  hasEmail: boolean;
}

function Pip({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide ${
        done ? "text-success" : "text-muted"
      }`}
    >
      <span
        className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
          done ? "bg-success text-white" : "border border-border-strong"
        }`}
      >
        {done && (
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </span>
  );
}

export default function StickyBottomBar({
  quantity,
  freeQuantity,
  totalWithVat,
  onReview,
  onSign,
  hasSignature,
  hasEmail,
}: StickyBottomBarProps) {
  const hasQty = quantity > 0;
  const ready = hasQty && hasSignature && hasEmail;

  // The bar is the single "next step" engine — it always points at the one
  // thing left to do.
  let action: { label: string; onClick?: () => void; disabled: boolean };
  if (!hasQty) {
    action = { label: "Zadajte počet kusov", disabled: true };
  } else if (!hasSignature) {
    action = { label: "Podpísať", onClick: onSign, disabled: false };
  } else if (!hasEmail) {
    action = { label: "Chýba e-mail firmy", disabled: true };
  } else {
    action = { label: "Skontrolovať", onClick: onReview, disabled: false };
  }

  return (
    <div className="reveal fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-sm shadow-[0_-4px_16px_oklch(0.15_0.01_80/0.08)] lg:hidden">
      <div className="flex min-h-[4.25rem] items-center gap-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2.5">
            <Pip done={hasQty} label="Počet" />
            <Pip done={hasSignature} label="Podpis" />
          </div>
          <div className="font-mono text-xl font-bold leading-none tabular-nums">
            {formatEUR(totalWithVat)}
          </div>
          {hasQty && (
            <div className="mt-0.5 text-xs text-muted">
              {quantity} ks{freeQuantity > 0 ? ` + ${freeQuantity} grátis` : ""}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          className={`${ready ? btn.primary : !hasQty || !hasEmail ? btn.secondary : btn.primary} h-12 shrink-0 px-5 text-[15px] ${ready ? "ready-pulse" : ""}`}
        >
          <span key={action.label} className="swap-in inline-flex items-center gap-2">
            {ready && (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
            {!hasSignature && hasQty && hasEmail && (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 17.5L17.5 3a2.1 2.1 0 013 3L6 20.5 2 22z" />
              </svg>
            )}
            {action.label}
          </span>
        </button>
      </div>
    </div>
  );
}
