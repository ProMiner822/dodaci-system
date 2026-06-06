"use client";

import { useState } from "react";
import { formatDateSK, formatEUR, formatNum } from "@/lib/formatting";
import { inputClass } from "@/lib/styles";
import { PRODUCT_NAME } from "@/lib/constants";
import QuantityStepper from "./QuantityStepper";

interface ItemsPanelProps {
  deliveryNumber: string;
  date: string;
  quantity: number;
  freeQuantity: number;
  priceWithVat: number;
  note: string;
  onDeliveryNumberChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onFreeQuantityChange: (value: number) => void;
  onPriceChange: (value: number) => void;
  onNoteChange: (value: string) => void;
  errors?: Record<string, string>;
}

export default function ItemsPanel({
  deliveryNumber,
  date,
  quantity,
  freeQuantity,
  priceWithVat,
  note,
  onDeliveryNumberChange,
  onDateChange,
  onQuantityChange,
  onFreeQuantityChange,
  onPriceChange,
  onNoteChange,
  errors = {},
}: ItemsPanelProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const lineTotal = quantity * priceWithVat;

  return (
    <div>
      {/* Product line context */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-sm font-bold">{PRODUCT_NAME}</span>
        <span className="font-mono text-xs text-muted tabular-nums">
          {formatNum(priceWithVat)} € / ks
        </span>
      </div>

      {/* Hero: paid quantity */}
      <div className="px-4 pt-5 pb-4">
        <QuantityStepper
          value={quantity}
          onChange={onQuantityChange}
          min={0}
          label="Platené (ks)"
          error={errors.quantity}
          size="lg"
          quickAdd={[10, 25, 50]}
        />

        {/* Live line readout */}
        {quantity > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 font-mono text-sm text-muted tabular-nums">
            <span>{formatNum(quantity)} ks</span>
            <span className="text-border-strong">×</span>
            <span>{formatNum(priceWithVat)} €</span>
            <span className="text-border-strong">=</span>
            <span className="font-bold text-foreground">{formatEUR(lineTotal)}</span>
          </div>
        )}
      </div>

      {/* Grátis */}
      <div className="border-t border-border px-4 py-4">
        <QuantityStepper
          value={freeQuantity}
          onChange={onFreeQuantityChange}
          min={0}
          label="Grátis (ks)"
          size="sm"
        />
      </div>

      {/* Collapsible details */}
      <div className="border-t border-border">
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="flex min-h-[48px] w-full items-center justify-between px-4 text-sm font-bold text-muted transition-colors hover:text-foreground"
          aria-expanded={detailsOpen}
        >
          <span>Podrobnosti</span>
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
            className={`transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div
          className="grid transition-[grid-template-rows] duration-200 ease-out"
          style={{ gridTemplateRows: detailsOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 px-4 pb-4 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="delivery-number" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
                    Číslo dodacieho listu
                  </label>
                  <input
                    id="delivery-number"
                    className={`${inputClass(errors.deliveryNumber)} font-mono`}
                    value={deliveryNumber}
                    onChange={(e) => onDeliveryNumberChange(e.target.value)}
                    aria-invalid={!!errors.deliveryNumber}
                    aria-describedby={errors.deliveryNumber ? "delivery-number-error" : undefined}
                  />
                  {errors.deliveryNumber && (
                    <span id="delivery-number-error" role="alert" className="mt-1 block text-xs text-danger">
                      {errors.deliveryNumber}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="delivery-date" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
                    Dátum
                  </label>
                  <input
                    id="delivery-date"
                    type="date"
                    className={`${inputClass(errors.date)} font-mono`}
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                  />
                  {date && <span className="mt-1 block text-xs text-muted">{formatDateSK(date)}</span>}
                </div>
              </div>

              <div>
                <label htmlFor="price-with-vat" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
                  Cena za kus s DPH
                </label>
                <input
                  id="price-with-vat"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className={`${inputClass(errors.priceWithVat)} font-mono`}
                  value={priceWithVat || ""}
                  onChange={(e) => onPriceChange(e.target.value === "" ? 0 : Number(e.target.value))}
                />
              </div>

              <div>
                <label htmlFor="note" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
                  Poznámka
                </label>
                <input
                  id="note"
                  className={inputClass(errors.note)}
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="Poznámka k dodávke…"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
