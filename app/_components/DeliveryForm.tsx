"use client";

import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { Company } from "@/lib/types";
import { supplier, defaultCompanies, VAT_RATE, DEFAULT_NOTE, STORAGE_KEYS } from "@/lib/constants";
import { formatNum, formatDateSK, todayISO } from "@/lib/formatting";
import { calculateDeliveryPrices } from "@/lib/calculations";
import { nextDeliveryNumber } from "@/lib/delivery-number";
import ActionBar from "./ActionBar";
import CompanyPanel from "./CompanyPanel";
import ItemsPanel from "./ItemsPanel";
import SignatureCanvas from "./SignatureCanvas";
import DeliveryPreview from "./DeliveryPreview";
import { useToast } from "./Toast";

// --- State & Reducer ---

interface DeliveryState {
  companies: Company[];
  selectedCompanyId: string;
  deliveryNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  quantity: number;
  freeQuantity: number;
  note: string;
  signatureData: string;
  sheetSaved: boolean;
}

type Action =
  | { type: "SET_FIELD"; field: keyof DeliveryState; value: DeliveryState[keyof DeliveryState] }
  | { type: "SELECT_COMPANY"; id: string; company: Company }
  | { type: "UPDATE_COMPANY"; field: keyof Company; value: string | number }
  | { type: "ADD_COMPANY"; company: Company }
  | { type: "LOAD_STATE"; state: Partial<DeliveryState> }
  | { type: "RESET_FORM"; deliveryNumber: string };

function reducer(state: DeliveryState, action: Action): DeliveryState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value, sheetSaved: false };
    case "SELECT_COMPANY":
      return {
        ...state,
        selectedCompanyId: action.id,
        customerName: action.company.name,
        customerEmail: action.company.email,
        sheetSaved: false,
      };
    case "UPDATE_COMPANY":
      return {
        ...state,
        companies: state.companies.map((c) =>
          c.id === state.selectedCompanyId
            ? { ...c, [action.field]: action.value }
            : c,
        ),
        sheetSaved: false,
      };
    case "ADD_COMPANY":
      return {
        ...state,
        companies: [...state.companies, action.company],
        selectedCompanyId: action.company.id,
        customerName: action.company.name,
        customerEmail: action.company.email,
      };
    case "LOAD_STATE":
      return { ...state, ...action.state };
    case "RESET_FORM":
      return {
        ...state,
        deliveryNumber: action.deliveryNumber,
        date: todayISO(),
        customerName:
          state.companies.find((c) => c.id === state.selectedCompanyId)?.name ?? "",
        customerEmail:
          state.companies.find((c) => c.id === state.selectedCompanyId)?.email ?? "",
        quantity: 0,
        freeQuantity: 0,
        note: DEFAULT_NOTE,
        signatureData: "",
        sheetSaved: false,
      };
    default:
      return state;
  }
}

function getInitialState(): DeliveryState {
  return {
    companies: defaultCompanies,
    selectedCompanyId: "1",
    deliveryNumber: "",
    date: todayISO(),
    customerName: defaultCompanies[0].name,
    customerEmail: defaultCompanies[0].email,
    quantity: 0,
    freeQuantity: 0,
    note: DEFAULT_NOTE,
    signatureData: "",
    sheetSaved: false,
  };
}

// --- Barcode helper for PDF ---

function drawBarcodeBars(
  doc: import("jspdf").jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
) {
  const digits = String(text).replace(/\D/g, "") || "20260415";
  const bars = digits.repeat(4).slice(0, 48);
  const barWidth = width / bars.length;

  for (let i = 0; i < bars.length; i++) {
    const num = Number(bars[i]);
    if (num % 2 === 0) {
      doc.setFillColor(0, 0, 0);
      doc.rect(x + i * barWidth, y, Math.max(1, barWidth * 0.7), height, "F");
    }
  }
}

// --- Component ---

export default function DeliveryForm() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const selectedCompany = useMemo(
    () => state.companies.find((c) => c.id === state.selectedCompanyId) ?? state.companies[0],
    [state.companies, state.selectedCompanyId],
  );

  const priceWithVat = selectedCompany?.priceWithVat ?? 0;

  const calculations = useMemo(
    () => calculateDeliveryPrices(state.quantity, priceWithVat, VAT_RATE),
    [state.quantity, priceWithVat],
  );

  // Load from localStorage on mount
  useEffect(() => {
    dispatch({ type: "SET_FIELD", field: "deliveryNumber", value: nextDeliveryNumber() });

    const raw = localStorage.getItem(STORAGE_KEYS.form);
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      dispatch({
        type: "LOAD_STATE",
        state: {
          companies: data.companies ?? undefined,
          selectedCompanyId: data.selectedCompanyId ?? undefined,
          deliveryNumber: data.deliveryNumber ?? undefined,
          date: data.date ?? undefined,
          customerName: data.customerName ?? undefined,
          customerEmail: data.customerEmail ?? undefined,
          quantity: typeof data.quantity === "number" ? data.quantity : undefined,
          freeQuantity: typeof data.freeQuantity === "number" ? data.freeQuantity : undefined,
          note: data.note ?? undefined,
          signatureData: data.signatureData ?? undefined,
        },
      });
    } catch (error: unknown) {
      console.error("Failed to load saved data:", error instanceof Error ? error.message : error);
    }
  }, []);

  // --- Validation ---

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!state.deliveryNumber.trim()) {
      newErrors.deliveryNumber = "Číslo dodacieho listu je povinné";
    }
    if (state.quantity <= 0) {
      newErrors.quantity = "Počet kusov musí byť väčší ako 0";
    }
    if (!state.customerEmail.trim() || !state.customerEmail.includes("@")) {
      newErrors.customerEmail = "Zadajte platný email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // --- Actions ---

  function saveToLocalStorage() {
    localStorage.setItem(
      STORAGE_KEYS.form,
      JSON.stringify({
        companies: state.companies,
        selectedCompanyId: state.selectedCompanyId,
        deliveryNumber: state.deliveryNumber,
        date: state.date,
        customerName: state.customerName,
        customerEmail: state.customerEmail,
        quantity: state.quantity,
        freeQuantity: state.freeQuantity,
        note: state.note,
        signatureData: state.signatureData,
      }),
    );
    addToast("Uložené do lokálneho úložiska", "success");
  }

  async function saveDeliveryToGoogleSheet() {
    if (state.sheetSaved) return true;

    try {
      const response = await fetch("/api/save-to-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datum: state.date,
          firma: state.customerName,
          pocetKs: state.quantity,
          cenaZaKsSDPH: priceWithVat,
          cisloDodaciehoListu: state.deliveryNumber,
          emailFirmy: state.customerEmail,
          podpisane: !!state.signatureData,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        dispatch({ type: "SET_FIELD", field: "sheetSaved", value: true });
        return true;
      }
      return false;
    } catch (error: unknown) {
      console.error("Sheet save error:", error instanceof Error ? error.message : error);
      return false;
    }
  }

  async function generatePDF() {
    setIsGeneratingPDF(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      // Load Roboto fonts for SK/CZ diacritics support
      const [regularBuf, boldBuf] = await Promise.all([
        fetch("/fonts/Roboto-Regular.ttf").then((r) => r.arrayBuffer()),
        fetch("/fonts/Roboto-Bold.ttf").then((r) => r.arrayBuffer()),
      ]);
      const toBase64 = (buf: ArrayBuffer) => {
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      };
      doc.addFileToVFS("Roboto-Regular.ttf", toBase64(regularBuf));
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFileToVFS("Roboto-Bold.ttf", toBase64(boldBuf));
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

      const leftX = 24;
      const rightX = 415;
      const midX = 396;
      const pageWidth = 595;

      doc.setFont("Roboto", "bold");
      doc.setFontSize(12);
      doc.text("Dodávateľ", leftX, 30);
      doc.setFontSize(15);
      doc.text(supplier.name, leftX, 54);
      doc.setFont("Roboto", "normal");
      doc.setFontSize(10);
      doc.text(supplier.address1, leftX, 74);
      doc.text(supplier.address2, leftX, 92);
      doc.text(supplier.country, leftX, 110);
      doc.text(`IČO: ${supplier.ico}`, leftX, 150);
      doc.text(`IČ DPH: ${supplier.icdph}`, leftX + 110, 150);
      doc.text(`DIČ: ${supplier.dic}`, leftX + 280, 150);

      doc.setFont("Roboto", "bold");
      doc.text("Kontaktné údaje", leftX, 190);
      doc.setFont("Roboto", "normal");
      doc.text("E-mail:", leftX, 214);
      doc.text(supplier.email, leftX + 80, 214);
      doc.text("Telefón:", leftX, 236);
      doc.text(supplier.phone, leftX + 80, 236);

      doc.setLineWidth(1);
      doc.setDrawColor(205, 205, 205);
      doc.line(midX, 10, midX, 445);

      doc.setFont("Roboto", "bold");
      doc.setFontSize(20);
      doc.text("Dodací list", 490, 30, { align: "center" });

      doc.rect(rightX, 14, 140, 38);
      doc.setFontSize(11);
      doc.text(`k faktúre č. ${state.deliveryNumber}`, rightX + 70, 38, {
        align: "center",
      });
      drawBarcodeBars(doc, rightX + 68, 58, 70, 16, state.deliveryNumber);

      doc.setFont("Roboto", "bold");
      doc.setFontSize(12);
      doc.text("Odberateľ", 430, 240);
      doc.setFontSize(15);
      doc.text(state.customerName, 430, 262);
      doc.setFont("Roboto", "normal");
      doc.setFontSize(10);
      const addressLines = doc.splitTextToSize(
        selectedCompany?.address ?? "",
        150,
      );
      doc.text(addressLines, 430, 280);
      const addressEndY = 280 + addressLines.length * 16;
      doc.text("Slovensko", 430, addressEndY + 10);
      doc.text(`IČO: ${selectedCompany?.ico ?? ""}`, 430, addressEndY + 34);
      doc.text(`IČ DPH: ${selectedCompany?.icdph ?? ""}`, 505, addressEndY + 34);
      doc.text(`DIČ: ${selectedCompany?.dic ?? ""}`, 430, addressEndY + 54);

      doc.setFont("Roboto", "normal");
      doc.text("Spôsob úhrady:", leftX, 412);
      doc.setFont("Roboto", "bold");
      doc.text("Prevodom", leftX + 100, 412);
      doc.setFont("Roboto", "normal");
      doc.text("Mena:", leftX, 436);
      doc.setFont("Roboto", "bold");
      doc.text("EUR", leftX + 65, 436);

      doc.rect(0, 460, pageWidth, 82);
      doc.setFont("Roboto", "bold");
      doc.setFontSize(11);
      doc.text("Dátum", leftX, 486);
      doc.setFont("Roboto", "normal");
      doc.text("vystavenia:", leftX, 516);
      doc.setFont("Roboto", "bold");
      doc.text(formatDateSK(state.date), leftX + 85, 516);
      doc.setFont("Roboto", "normal");
      doc.text("dodania:", leftX + 190, 516);
      doc.setFont("Roboto", "bold");
      doc.text(formatDateSK(state.date), leftX + 260, 516);

      const tableY = 575;
      const cols = [leftX, 230, 295, 365, 405, 468, 535];
      doc.setFillColor(225, 225, 225);
      doc.rect(leftX - 2, tableY, 545, 26, "F");
      doc.setFont("Roboto", "bold");
      doc.text("Označenie dodávky", leftX + 4, tableY + 17);
      doc.text("Počet", cols[1], tableY + 17);
      doc.text("m. j.", cols[2], tableY + 17);
      doc.text("Cena za m.j.", cols[3], tableY + 17);
      doc.text("DPH %", cols[4], tableY + 17);
      doc.text("Bez DPH", cols[5], tableY + 17);
      doc.text("DPH", cols[6], tableY + 17);
      doc.text("Spolu", 570, tableY + 17, { align: "right" });

      const row1Y = tableY + 38;
      doc.setFont("Roboto", "normal");
      doc.text("Avokado hass", leftX + 4, row1Y);
      doc.text(formatNum(state.quantity), cols[1], row1Y);
      doc.text("ks", cols[2], row1Y);
      doc.text(formatNum(priceWithVat), cols[3], row1Y);
      doc.text("19", cols[4], row1Y);
      doc.text(formatNum(calculations.totalWithoutVat), cols[5], row1Y);
      doc.text(formatNum(calculations.vatAmount), cols[6], row1Y);
      doc.setFont("Roboto", "bold");
      doc.text(formatNum(calculations.totalWithVat), 570, row1Y, {
        align: "right",
      });
      doc.setFont("Roboto", "normal");
      doc.line(leftX, row1Y + 8, 570, row1Y + 8);

      const row2Y = row1Y + 22;
      doc.text("Avokado hass", leftX + 4, row2Y);
      doc.text(formatNum(state.freeQuantity), cols[1], row2Y);
      doc.text("ks", cols[2], row2Y);
      doc.text(formatNum(0), cols[3], row2Y);
      doc.text("19", cols[4], row2Y);
      doc.text(formatNum(0), cols[5], row2Y);
      doc.text(formatNum(0), cols[6], row2Y);
      doc.setFont("Roboto", "bold");
      doc.text(formatNum(0), 570, row2Y, { align: "right" });
      doc.setFont("Roboto", "normal");
      doc.line(leftX, row2Y + 8, 570, row2Y + 8);

      const signY = 735;
      doc.setFont("Roboto", "bold");
      doc.text("Prevzal", leftX, signY);
      doc.setLineDashPattern([1, 2], 0);
      doc.line(leftX, signY + 18, 190, signY + 18);
      doc.text("Dňa", leftX, signY + 48);
      doc.line(leftX, signY + 66, 190, signY + 66);
      doc.setLineDashPattern([], 0);

      if (state.signatureData) {
        doc.addImage(state.signatureData, "PNG", 220, 715, 150, 55);
      }

      doc.save(`dodaci-list-${state.deliveryNumber}.pdf`);
      addToast("PDF stiahnuté", "success");
    } catch (error: unknown) {
      console.error("PDF error:", error instanceof Error ? error.message : error);
      addToast("Chyba pri generovaní PDF", "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  async function sendByEmail() {
    if (!validate()) return;
    if (!state.signatureData) {
      addToast("Podpis zákazníka je povinný pre odoslanie", "error");
      return;
    }

    setIsSendingEmail(true);
    try {
      // Save to Google Sheets first
      await saveDeliveryToGoogleSheet();

      const response = await fetch("/api/send-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryNumber: state.deliveryNumber,
          date: state.date,
          customerName: state.customerName,
          customerEmail: state.customerEmail,
          address: selectedCompany?.address ?? "",
          ico: selectedCompany?.ico ?? "",
          icdph: selectedCompany?.icdph ?? "",
          quantity: state.quantity,
          freeQuantity: state.freeQuantity,
          priceWithVat,
          totalWithoutVat: calculations.totalWithoutVat,
          vatAmount: calculations.vatAmount,
          totalWithVat: calculations.totalWithVat,
          signatureData: state.signatureData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        addToast("Email sa nepodarilo odoslať.", "error");
        return;
      }

      addToast("Email s PDF bol odoslaný.", "success");
    } catch (error: unknown) {
      console.error("Email error:", error instanceof Error ? error.message : error);
      addToast("Chyba pri odosielaní emailu.", "error");
    } finally {
      setIsSendingEmail(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function resetForm() {
    dispatch({ type: "RESET_FORM", deliveryNumber: nextDeliveryNumber() });
    addToast("Nový dodací list pripravený", "success");
  }

  const handleSelectCompany = useCallback(
    (id: string) => {
      const company = state.companies.find((c) => c.id === id) ?? state.companies[0];
      dispatch({ type: "SELECT_COMPANY", id, company });
    },
    [state.companies],
  );

  const handleSignatureChange = useCallback((data: string) => {
    dispatch({ type: "SET_FIELD", field: "signatureData", value: data });
  }, []);

  return (
    <div className="min-h-screen bg-background px-3 py-3 font-sans text-foreground sm:px-6 sm:py-4">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Preskočiť na hlavný obsah
      </a>

      <ActionBar
        onSave={saveToLocalStorage}
        onGeneratePDF={generatePDF}
        onSendEmail={sendByEmail}
        onLogout={handleLogout}
        canSendEmail={!!state.signatureData && !!state.customerEmail}
        isSendingEmail={isSendingEmail}
        isGeneratingPDF={isGeneratingPDF}
      />

      <main
        id="main-content"
        className="mx-auto grid max-w-[1500px] grid-cols-1 items-start gap-3 sm:gap-4 lg:grid-cols-[1.55fr_0.75fr]"
      >
        {/* Preview - shown second on mobile, first on desktop */}
        <div className="order-2 lg:order-1">
          <DeliveryPreview
            supplier={supplier}
            selectedCompany={selectedCompany}
            customerName={state.customerName}
            deliveryNumber={state.deliveryNumber}
            date={state.date}
            quantity={state.quantity}
            freeQuantity={state.freeQuantity}
            calculations={calculations}
            priceWithVat={priceWithVat}
            signatureData={state.signatureData}
          />
        </div>

        {/* Controls - shown first on mobile */}
        <div className="order-1 grid gap-3 sm:gap-4 lg:order-2">
          <CompanyPanel
            companies={state.companies}
            selectedCompanyId={state.selectedCompanyId}
            customerEmail={state.customerEmail}
            onSelectCompany={handleSelectCompany}
            onEmailChange={(email) =>
              dispatch({ type: "SET_FIELD", field: "customerEmail", value: email })
            }
            onUpdateCompany={(field, value) =>
              dispatch({ type: "UPDATE_COMPANY", field, value })
            }
            onAddCompany={() =>
              dispatch({
                type: "ADD_COMPANY",
                company: {
                  id: Date.now().toString(),
                  name: "Nová firma",
                  email: "firma@email.sk",
                  priceWithVat: 1.85,
                  ico: "",
                  icdph: "",
                  dic: "",
                  address: "",
                },
              })
            }
            selectedCompany={selectedCompany}
          />

          <ItemsPanel
            deliveryNumber={state.deliveryNumber}
            date={state.date}
            quantity={state.quantity}
            freeQuantity={state.freeQuantity}
            priceWithVat={priceWithVat}
            note={state.note}
            onDeliveryNumberChange={(v) =>
              dispatch({ type: "SET_FIELD", field: "deliveryNumber", value: v })
            }
            onDateChange={(v) =>
              dispatch({ type: "SET_FIELD", field: "date", value: v })
            }
            onQuantityChange={(v) =>
              dispatch({ type: "SET_FIELD", field: "quantity", value: v })
            }
            onFreeQuantityChange={(v) =>
              dispatch({ type: "SET_FIELD", field: "freeQuantity", value: v })
            }
            onPriceChange={(v) =>
              dispatch({ type: "UPDATE_COMPANY", field: "priceWithVat", value: v })
            }
            onNoteChange={(v) =>
              dispatch({ type: "SET_FIELD", field: "note", value: v })
            }
            errors={errors}
          />

          <SignatureCanvas
            signatureData={state.signatureData}
            onSignatureChange={handleSignatureChange}
          />

          <button
            type="button"
            onClick={resetForm}
            className="min-h-[44px] w-full rounded-xl border border-danger/30 bg-surface px-3.5 py-3 font-bold text-danger shadow-md transition-colors hover:bg-danger-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger active:scale-[0.98]"
          >
            Nový dodací list dnes
          </button>
        </div>
      </main>
    </div>
  );
}
