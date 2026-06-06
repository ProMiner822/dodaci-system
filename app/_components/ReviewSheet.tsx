"use client";

import { useEffect, useRef, useState } from "react";
import type { Company, Supplier, DeliveryCalculations } from "@/lib/types";
import { formatEUR } from "@/lib/formatting";
import { btn } from "@/lib/styles";
import Spinner from "./Spinner";
import DocumentModal from "./DocumentModal";

interface ReviewSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSending: boolean;
  supplier: Supplier;
  selectedCompany: Company | undefined;
  customerName: string;
  customerEmail: string;
  deliveryNumber: string;
  date: string;
  quantity: number;
  freeQuantity: number;
  calculations: DeliveryCalculations;
  priceWithVat: number;
  signatureData: string;
}

export default function ReviewSheet({
  open,
  onClose,
  onConfirm,
  isSending,
  supplier,
  selectedCompany,
  customerName,
  customerEmail,
  deliveryNumber,
  date,
  quantity,
  freeQuantity,
  calculations,
  priceWithVat,
  signatureData,
}: ReviewSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [docOpen, setDocOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dialog-bottom-sheet rounded-t-lg border border-border bg-surface text-foreground shadow-xl lg:rounded-lg"
      onCancel={(e) => {
        if (isSending) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isSending) onClose();
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">
            Kontrola pred odoslaním
          </h2>

          {/* Summary — reads like the slip */}
          <div className="divide-y divide-border border-y border-border">
            <Row label="Odberateľ" value={customerName} />
            <Row label="E-mail" value={customerEmail} mono />
            <Row label="Dodací list" value={deliveryNumber} mono />
            <Row label="Platené" value={`${quantity} ks`} mono />
            {freeQuantity > 0 && <Row label="Grátis" value={`${freeQuantity} ks`} mono />}
            <div className="flex items-center justify-between gap-3 bg-surface-alt px-4 py-3">
              <span className="font-bold">Celkom s DPH</span>
              <span className="font-mono text-xl font-bold tabular-nums">
                {formatEUR(calculations.totalWithVat)}
              </span>
            </div>
          </div>

          {/* Signature confirmation */}
          {signatureData && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-success/30 bg-success-bg px-3 py-2.5">
              <svg className="h-4 w-4 shrink-0 text-success" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-bold text-success">Podpis priložený</span>
              <img
                src={signatureData}
                alt="Podpis"
                className="ml-auto h-8 w-20 rounded border border-success/30 object-contain bg-white"
              />
            </div>
          )}

          {/* Open the full, zoomable document */}
          <button
            type="button"
            onClick={() => setDocOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-bold text-accent transition-colors hover:border-border-strong hover:bg-accent-soft focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            Zobraziť náhľad dokumentu
          </button>

          <DocumentModal
            open={docOpen}
            onClose={() => setDocOpen(false)}
            supplier={supplier}
            selectedCompany={selectedCompany}
            customerName={customerName}
            deliveryNumber={deliveryNumber}
            date={date}
            quantity={quantity}
            freeQuantity={freeQuantity}
            calculations={calculations}
            priceWithVat={priceWithVat}
            signatureData={signatureData}
          />

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className={`${btn.secondary} min-h-[48px] flex-1 px-4 py-3`}
            >
              Zrušiť
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSending}
              className={`${btn.primary} min-h-[48px] flex-[2] px-4 py-3`}
            >
              {isSending ? (
                <>
                  <Spinner size="sm" />
                  Odosielam…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Potvrdiť a odoslať
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="shrink-0 text-sm text-muted">{label}</span>
      <span
        className={`min-w-0 truncate text-sm font-semibold ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
