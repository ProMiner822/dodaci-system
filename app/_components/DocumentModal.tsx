"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Company, Supplier, DeliveryCalculations } from "@/lib/types";
import { PreviewContent } from "./DeliveryPreview";

interface DocumentModalProps {
  open: boolean;
  onClose: () => void;
  supplier: Supplier;
  selectedCompany: Company | undefined;
  customerName: string;
  deliveryNumber: string;
  date: string;
  quantity: number;
  freeQuantity: number;
  calculations: DeliveryCalculations;
  priceWithVat: number;
  signatureData: string;
}

const A4_WIDTH = 595; // px, matches the document/PDF width

function fitScale() {
  if (typeof window === "undefined") return 0.6;
  const w = Math.min(window.innerWidth, 760) - 32;
  return Math.max(0.35, Math.min(1, w / A4_WIDTH));
}

// A native <dialog> so it always lands in the top layer — above the review
// sheet (also a modal dialog) and the rest of the app.
export default function DocumentModal({
  open,
  onClose,
  ...preview
}: DocumentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // fitScale() reads window, so initial value differs server vs client. Because
  // the dialog is not rendered until `open` (client-only interaction), this
  // never reaches SSR — no hydration mismatch.
  const [scale, setScale] = useState(fitScale);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [open]);

  const zoomOut = () => setScale((s) => Math.max(0.3, +(s - 0.15).toFixed(2)));
  const zoomIn = () => setScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)));

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none overflow-hidden bg-transparent"
    >
      <div className="flex h-[100dvh] flex-col bg-[oklch(0.16_0.01_80/0.97)]">
        {/* Toolbar */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top)] sm:px-4">
          <span className="min-w-0 truncate font-mono text-sm text-white/80">
            {preview.deliveryNumber}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={zoomOut}
              aria-label="Oddialiť"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setScale(fitScale())}
              className="min-w-[3.5rem] rounded-lg px-2 py-2 font-mono text-sm text-white/90 tabular-nums transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={zoomIn}
              aria-label="Priblížiť"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div className="mx-1 h-5 w-px bg-white/20" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Zavrieť"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable, zoomable document */}
        <div className="flex-1 overflow-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-fit">
            <div
              className="bg-white text-black shadow-2xl"
              style={{ width: A4_WIDTH, padding: 24, zoom: scale } as CSSProperties}
            >
              <PreviewContent {...preview} />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
