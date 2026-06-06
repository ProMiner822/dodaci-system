"use client";

import { useState, useEffect, useRef } from "react";
import type { Company, Supplier, DeliveryCalculations } from "@/lib/types";
import { formatNum, formatDateSK } from "@/lib/formatting";
import DocumentModal from "./DocumentModal";

interface DeliveryPreviewProps {
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

export default function DeliveryPreview({
  supplier,
  selectedCompany,
  customerName,
  deliveryNumber,
  date,
  quantity,
  freeQuantity,
  calculations,
  priceWithVat,
  signatureData,
}: DeliveryPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [docOpen, setDocOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      // 595 is the A4 document width, subtract padding
      const newScale = Math.min(1, (width - 16) / 595);
      setScale(newScale);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Mobile: Toggle button + collapsible scaled preview */}
      <div className="lg:hidden" ref={containerRef}>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex min-h-[48px] flex-1 items-center justify-between rounded-lg border border-border bg-surface px-4 text-sm font-bold text-muted transition-colors hover:text-foreground"
            aria-expanded={showPreview}
          >
            <span>Náhľad dokumentu</span>
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
              className={`transition-transform duration-200 ${showPreview ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setDocOpen(true)}
            aria-label="Zväčšiť dokument"
            className="flex min-h-[48px] w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-border-strong hover:text-foreground active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </button>
        </div>

        {showPreview && (
          <button
            type="button"
            onClick={() => setDocOpen(true)}
            aria-label="Otvoriť dokument na celú obrazovku"
            className="mb-4 block w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-surface-alt"
          >
            <div
              style={{ height: 842 * scale + 16 }}
              className="overflow-hidden p-2"
            >
              <div
                style={{
                  width: 595,
                  minHeight: 842,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                className="bg-white p-6 text-black"
              >
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
          </button>
        )}
      </div>

      {/* Desktop: Always visible */}
      <div className="hidden lg:block">
        <div className="rounded-lg border border-border bg-surface-alt p-4">
          <button
            type="button"
            onClick={() => setDocOpen(true)}
            className="block w-full cursor-zoom-in"
            aria-label="Otvoriť dokument na celú obrazovku"
          >
          <div
            className="min-h-[980px] bg-white p-6 text-black"
            role="document"
            aria-label="Náhľad dodacieho listu"
          >
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
          </button>
        </div>
      </div>

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
    </>
  );
}

export function PreviewContent({
  supplier,
  selectedCompany,
  customerName,
  deliveryNumber,
  date,
  quantity,
  freeQuantity,
  calculations,
  priceWithVat,
  signatureData,
}: DeliveryPreviewProps) {
  return (
    <>
      {/* Top: Supplier + Document header */}
      <div className="grid min-h-[370px] grid-cols-[1fr_1px_0.9fr] gap-6">
        {/* Supplier */}
        <div className="text-[14px] leading-relaxed">
          <div className="font-bold">Dodávateľ</div>
          <div className="text-[16px] font-bold">{supplier.name}</div>
          <div>{supplier.address1}</div>
          <div>{supplier.address2}</div>
          <div>{supplier.country}</div>
          <div className="mt-4">
            IČO: {supplier.ico} &nbsp;&nbsp;&nbsp; IČ DPH: {supplier.icdph}
            &nbsp;&nbsp;&nbsp; DIČ: {supplier.dic}
          </div>
          <div className="mt-7">
            <span className="font-bold">Kontaktné údaje</span>
          </div>
          <div className="mt-2">E-mail: {supplier.email}</div>
          <div>Telefón: {supplier.phone}</div>
        </div>

        {/* Divider */}
        <div className="bg-gray-300" aria-hidden="true" />

        {/* Right: Document label + Recipient */}
        <div className="relative text-[14px] leading-relaxed">
          <div className="mb-2.5 text-center text-[22px] font-bold">
            Dodací list
          </div>
          <div className="mx-auto w-[220px] border-2 border-gray-300 p-3 text-center text-[16px] font-bold">
            k faktúre č. {deliveryNumber}
          </div>
          <div
            className="mx-auto mt-2 h-[18px] w-[140px]"
            style={{
              background:
                "repeating-linear-gradient(90deg,#000 0 3px,#fff 3px 5px)",
            }}
            aria-hidden="true"
          />

          <div className="mt-[120px]">
            <div className="font-bold">Odberateľ</div>
            <div className="text-[16px] font-bold">{customerName}</div>
            <div>{selectedCompany?.address}</div>
            <div>Slovensko</div>
            <div className="mt-2.5">
              IČO: {selectedCompany?.ico} &nbsp;&nbsp;&nbsp; IČ DPH:{" "}
              {selectedCompany?.icdph}
            </div>
            <div>DIČ: {selectedCompany?.dic}</div>
          </div>
        </div>
      </div>

      {/* Payment + Currency */}
      <div className="mt-4 flex gap-10 text-[14px]">
        <div>
          <span>Spôsob úhrady:</span> <strong>Prevodom</strong>
        </div>
        <div>
          <span>Mena:</span> <strong>EUR</strong>
        </div>
      </div>

      {/* Date box */}
      <div className="mt-4 border-2 border-gray-300 p-3.5 text-[14px]">
        <div className="font-bold">Dátum</div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span>vystavenia:</span>
          <strong>{formatDateSK(date)}</strong>
          <span className="ml-8">dodania:</span>
          <strong>{formatDateSK(date)}</strong>
        </div>
      </div>

      {/* Items table */}
      <table className="mt-8 w-full border-collapse text-[13px]">
        <caption className="sr-only">Položky dodacieho listu</caption>
        <thead>
          <tr>
            <th className="border-b border-gray-300 bg-gray-100 p-2 text-left">
              Označenie dodávky
            </th>
            <th className="border-b border-gray-300 bg-gray-100 p-2 text-right">
              Počet
            </th>
            <th className="border-b border-gray-300 bg-gray-100 p-2 text-right">
              m. j.
            </th>
            <th className="border-b border-gray-300 bg-gray-100 p-2 text-right">
              Cena/ks
            </th>
            <th className="border-b border-gray-300 bg-gray-100 p-2 text-right">
              DPH %
            </th>
            <th className="border-b border-gray-300 bg-gray-100 p-2 text-right">
              Bez DPH
            </th>
            <th className="border-b border-gray-300 bg-gray-100 p-2 text-right">
              DPH
            </th>
            <th className="border-b border-gray-300 bg-gray-100 p-2 text-right">
              Spolu
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-b border-gray-200 p-2 text-left">Avokado hass</td>
            <td className="border-b border-gray-200 p-2 text-right">{formatNum(quantity)}</td>
            <td className="border-b border-gray-200 p-2 text-right">ks</td>
            <td className="border-b border-gray-200 p-2 text-right">{formatNum(priceWithVat)}</td>
            <td className="border-b border-gray-200 p-2 text-right">19</td>
            <td className="border-b border-gray-200 p-2 text-right">{formatNum(calculations.totalWithoutVat)}</td>
            <td className="border-b border-gray-200 p-2 text-right">{formatNum(calculations.vatAmount)}</td>
            <td className="border-b border-gray-200 p-2 text-right font-bold">{formatNum(calculations.totalWithVat)}</td>
          </tr>
          <tr>
            <td className="border-b border-gray-200 p-2 text-left">Avokado hass</td>
            <td className="border-b border-gray-200 p-2 text-right">{formatNum(freeQuantity)}</td>
            <td className="border-b border-gray-200 p-2 text-right">ks</td>
            <td className="border-b border-gray-200 p-2 text-right">{formatNum(0)}</td>
            <td className="border-b border-gray-200 p-2 text-right">19</td>
            <td className="border-b border-gray-200 p-2 text-right">{formatNum(0)}</td>
            <td className="border-b border-gray-200 p-2 text-right">{formatNum(0)}</td>
            <td className="border-b border-gray-200 p-2 text-right font-bold">{formatNum(0)}</td>
          </tr>
        </tbody>
      </table>

      {/* Signature area */}
      <div className="mt-16 flex items-start justify-between gap-6">
        <div>
          <div className="font-bold">Prevzal</div>
          <div className="mt-2 w-[200px] border-b-[3px] border-dotted border-black" />
          <div className="mt-4 font-bold">Dňa</div>
          <div className="mt-2 w-[200px] border-b-[3px] border-dotted border-black" />
        </div>
        {signatureData ? (
          <img
            src={signatureData}
            alt={`Podpis zákazníka - ${customerName}`}
            className="h-[55px] w-[150px] border border-gray-300 object-contain"
          />
        ) : null}
      </div>
    </>
  );
}
