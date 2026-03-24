"use client";

import { useEffect, useRef } from "react";
import type { Company, Supplier, DeliveryCalculations } from "@/lib/types";
import { formatEUR } from "@/lib/formatting";
import Spinner from "./Spinner";
import { PreviewContent } from "./DeliveryPreview";

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
      className="dialog-bottom-sheet rounded-t-2xl bg-surface shadow-xl lg:rounded-2xl"
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
          <h2 className="mb-4 text-lg font-bold">Kontrola pred odoslaním</h2>

          {/* Summary */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Odberateľ</span>
              <span className="text-sm font-medium">{customerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Email</span>
              <span className="text-sm font-medium">{customerEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Dodací list</span>
              <span className="text-sm font-medium">{deliveryNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Platené</span>
              <span className="text-sm font-medium">{quantity} ks</span>
            </div>
            {freeQuantity > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Grátis</span>
                <span className="text-sm font-medium">{freeQuantity} ks</span>
              </div>
            )}

            <div className="my-3 h-px bg-border" />

            <div className="flex items-center justify-between">
              <span className="font-bold">Celkom s DPH</span>
              <span className="text-xl font-bold">{formatEUR(calculations.totalWithVat)}</span>
            </div>

            {/* Signature thumbnail */}
            {signatureData && (
              <div className="flex items-center gap-3 rounded-lg bg-success-bg/50 px-3 py-2">
                <svg className="h-4 w-4 shrink-0 text-success" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-medium text-success">Podpis priložený</span>
                <img
                  src={signatureData}
                  alt="Podpis"
                  className="ml-auto h-8 w-20 rounded border border-border object-contain bg-paper"
                />
              </div>
            )}
          </div>

          {/* Preview (scaled down) */}
          <details className="mt-4">
            <summary className="marker:hidden list-none cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-accent outline-none [&::-webkit-details-marker]:hidden">
              Zobraziť náhľad dokumentu
            </summary>
            <div className="mt-3 overflow-hidden rounded-lg border border-border" style={{ height: 842 * 0.45 + 16 }}>
              <div style={{ width: 595, minHeight: 842, transform: "scale(0.45)", transformOrigin: "top left" }}>
                <div className="bg-white p-6 text-black">
                  <PreviewContent
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
                </div>
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="min-h-[48px] flex-1 rounded-xl border border-border bg-surface px-4 py-3 font-bold transition-colors hover:bg-surface-alt active:scale-[0.98] disabled:opacity-50"
            >
              Zrušiť
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSending}
              className="min-h-[48px] flex-[2] rounded-xl bg-accent px-4 py-3 font-bold text-white transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50"
            >
              {isSending ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" />
                  Odosielam...
                </span>
              ) : (
                "Potvrdiť a odoslať"
              )}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
