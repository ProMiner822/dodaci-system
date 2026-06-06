"use client";

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Company } from "@/lib/types";
import { supplier, VAT_RATE, DEFAULT_NOTE, STORAGE_KEYS } from "@/lib/constants";
import { todayISO } from "@/lib/formatting";
import { calculateDeliveryPrices } from "@/lib/calculations";
import ActionBar from "./ActionBar";
import CustomerSelect from "./CustomerSelect";
import CompanyPanel from "./CompanyPanel";
import ItemsPanel from "./ItemsPanel";
import SignatureCanvas from "./SignatureCanvas";
import DeliveryPreview from "./DeliveryPreview";
import DeliveryHistory from "./DeliveryHistory";
import ReviewSheet from "./ReviewSheet";
import StickyBottomBar from "./StickyBottomBar";
import { useToast } from "./Toast";
import { enqueue, flushOutbox } from "@/lib/outbox";
import OutboxStatus from "./OutboxStatus";

// --- State & Reducer ---

interface DeliveryState {
  screen: "customer-select" | "delivery-form";
  companies: Company[];
  selectedCompanyId: string;
  deliveryNumber: string;
  // True once the user manually edits the number, so we don't overwrite it
  // with a freshly-minted one at send time.
  numberEdited: boolean;
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
  | { type: "SET_SCREEN"; screen: DeliveryState["screen"] }
  | { type: "SELECT_COMPANY"; id: string; company: Company }
  | { type: "UPDATE_COMPANY"; field: keyof Company; value: string | number }
  | { type: "REPLACE_COMPANY"; id: string; data: Omit<Company, "id"> }
  | { type: "ADD_COMPANY"; company: Company }
  | { type: "DELETE_COMPANY"; id: string }
  | { type: "LOAD_STATE"; state: Partial<DeliveryState> }
  | { type: "EDIT_DELIVERY_NUMBER"; value: string }
  | { type: "RESET_FORM"; deliveryNumber: string };

function reducer(state: DeliveryState, action: Action): DeliveryState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value, sheetSaved: false };
    case "SET_SCREEN":
      return { ...state, screen: action.screen };
    case "SELECT_COMPANY":
      return {
        ...state,
        selectedCompanyId: action.id,
        customerName: action.company.name,
        customerEmail: action.company.email,
        sheetSaved: false,
        screen: "delivery-form",
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
    case "REPLACE_COMPANY": {
      const updated = state.companies.map((c) =>
        c.id === action.id ? { ...c, ...action.data } : c,
      );
      const wasSelected = state.selectedCompanyId === action.id;
      return {
        ...state,
        companies: updated,
        customerName: wasSelected ? action.data.name : state.customerName,
        customerEmail: wasSelected ? action.data.email : state.customerEmail,
        sheetSaved: false,
      };
    }
    case "ADD_COMPANY":
      return {
        ...state,
        companies: [...state.companies, action.company],
        selectedCompanyId: action.company.id,
        customerName: action.company.name,
        customerEmail: action.company.email,
        screen: "delivery-form",
      };
    case "DELETE_COMPANY": {
      const remaining = state.companies.filter((c) => c.id !== action.id);
      if (remaining.length === 0) return state;
      const newSelected =
        state.selectedCompanyId === action.id
          ? remaining[0]
          : remaining.find((c) => c.id === state.selectedCompanyId) ?? remaining[0];
      return {
        ...state,
        companies: remaining,
        selectedCompanyId: newSelected.id,
        customerName: newSelected.name,
        customerEmail: newSelected.email,
        sheetSaved: false,
      };
    }
    case "LOAD_STATE":
      return { ...state, ...action.state };
    case "EDIT_DELIVERY_NUMBER":
      return { ...state, deliveryNumber: action.value, numberEdited: true, sheetSaved: false };
    case "RESET_FORM":
      return {
        ...state,
        screen: "customer-select",
        deliveryNumber: action.deliveryNumber,
        numberEdited: false,
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
    screen: "customer-select",
    companies: [],
    selectedCompanyId: "",
    deliveryNumber: "",
    numberEdited: false,
    date: todayISO(),
    customerName: "",
    customerEmail: "",
    quantity: 0,
    freeQuantity: 0,
    note: DEFAULT_NOTE,
    signatureData: "",
    sheetSaved: false,
  };
}

// --- Component ---

export default function DeliveryForm() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastOrder, setLastOrder] = useState<{ quantity: number; freeQuantity: number } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);
  const isSendingRef = useRef(false);
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

  // Load data on mount: companies from API, form draft from localStorage
  useEffect(() => {
    async function init() {
      // Peek the next delivery number for display (does NOT increment the
      // counter — the number is committed at send time).
      try {
        const res = await fetch("/api/delivery-number");
        const data = await res.json();
        if (data.number) {
          dispatch({ type: "SET_FIELD", field: "deliveryNumber", value: data.number });
        }
      } catch {
        // Fallback: use date-based format
        const d = new Date();
        const dateKey = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
        dispatch({ type: "SET_FIELD", field: "deliveryNumber", value: `DL-${dateKey}-001` });
      }

      // Load companies from server
      try {
        const res = await fetch("/api/companies");
        const companies = await res.json();
        if (Array.isArray(companies) && companies.length > 0) {
          dispatch({ type: "LOAD_STATE", state: { companies } });
        }
      } catch {
        // Keep defaults
      }

      // Load form draft from localStorage (ephemeral form state only)
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.form);
        if (raw) {
          const data = JSON.parse(raw);
          dispatch({
            type: "LOAD_STATE",
            state: {
              selectedCompanyId: data.selectedCompanyId ?? undefined,
              deliveryNumber: data.deliveryNumber ?? undefined,
              // Intentionally do NOT restore `date` — it must always default to
              // today, never a stale value from a previous day's draft.
              customerName: data.customerName ?? undefined,
              customerEmail: data.customerEmail ?? undefined,
              quantity: typeof data.quantity === "number" ? data.quantity : undefined,
              freeQuantity: typeof data.freeQuantity === "number" ? data.freeQuantity : undefined,
              note: data.note ?? undefined,
              signatureData: data.signatureData ?? undefined,
            },
          });
        }
      } catch (error: unknown) {
        console.error("Failed to load saved data:", error instanceof Error ? error.message : error);
      }

      hasLoadedRef.current = true;
      setIsLoading(false);
    }

    init();
  }, []);

  // Save companies to server immediately when they change
  const companiesJsonRef = useRef("");
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const json = JSON.stringify(state.companies);
    if (json === companiesJsonRef.current) return;
    companiesJsonRef.current = json;

    fetch("/api/companies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: json,
    }).catch((err) => console.error("Failed to save companies:", err));
  }, [state.companies]);

  // Auto-save form draft to localStorage with debounce
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.form, JSON.stringify({
        selectedCompanyId: state.selectedCompanyId,
        deliveryNumber: state.deliveryNumber,
        customerName: state.customerName,
        customerEmail: state.customerEmail,
        quantity: state.quantity,
        freeQuantity: state.freeQuantity,
        note: state.note,
        signatureData: state.signatureData,
      }));
      setSaveStatus("saved");
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.selectedCompanyId, state.deliveryNumber, state.date, state.customerName, state.customerEmail, state.quantity, state.freeQuantity, state.note, state.signatureData]);

  // Register the service worker (offline shell) and flush any queued sends on
  // load and whenever connectivity returns.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    flushOutbox();
    function onOnline() {
      flushOutbox();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  // Load the customer's last order so we can offer "repeat last order".
  useEffect(() => {
    if (state.screen !== "delivery-form" || !state.customerName) {
      setLastOrder(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/history/last?company=${encodeURIComponent(state.customerName)}`)
      .then((r) => (r.ok ? r.json() : { last: null }))
      .then((d) => {
        if (cancelled) return;
        setLastOrder(
          d.last && d.last.quantity > 0
            ? { quantity: d.last.quantity, freeQuantity: d.last.freeQuantity ?? 0 }
            : null,
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [state.screen, state.customerName]);

  // Warn before tab close if form has data
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (state.quantity > 0 || state.signatureData) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.quantity, state.signatureData]);

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
    if (!state.signatureData) {
      newErrors.signatureData = "Podpis je povinný";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const messages = Object.values(newErrors);
      addToast(messages.join(", "), "error");
    }
    return Object.keys(newErrors).length === 0;
  }

  // --- Actions ---

  async function saveDeliveryToGoogleSheet(deliveryNumber = state.deliveryNumber) {
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
          cisloDodaciehoListu: deliveryNumber,
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
    if (!validate()) return;
    setIsGeneratingPDF(true);
    try {
      const response = await fetch("/api/generate-pdf", {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("PDF generation failed:", errorData);
        addToast("Chyba pri generovaní PDF", "error");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dodaci-list-${state.deliveryNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("PDF stiahnuté", "success");
    } catch (error) {
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
    // Re-entry guard: a fast double-tap must not send twice with the same
    // delivery number (state updates aren't synchronous, so isSendingEmail
    // alone can't block it).
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    setIsSendingEmail(true);
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    let deliveryNumber = state.deliveryNumber;
    let needsNumber = false;

    try {
      // Commit the delivery number now (unless the user typed a custom one),
      // so abandoned forms never consume a number. Offline: defer minting to
      // the flush so two queued notes can't collide on the same number.
      if (!state.numberEdited) {
        if (offline) {
          needsNumber = true;
        } else {
          try {
            const res = await fetch("/api/delivery-number", { method: "POST" });
            const data = await res.json();
            if (data.number) {
              deliveryNumber = data.number;
              dispatch({ type: "SET_FIELD", field: "deliveryNumber", value: deliveryNumber });
            }
          } catch {
            needsNumber = true;
          }
        }
      }

      const payload = {
        deliveryNumber,
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
        ccEmails: selectedCompany?.ccEmails ?? "",
      };

      // Offline (or we couldn't reach the counter): queue and finish.
      if (offline || needsNumber) {
        enqueue(payload, needsNumber);
        setReviewOpen(false);
        addToast("Bez pripojenia — dodací list je uložený a odošle sa po pripojení.", "success");
        await resetForm();
        return;
      }

      await saveDeliveryToGoogleSheet(deliveryNumber);

      const response = await fetch("/api/send-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        // Server reachable but failed — don't lose the note; queue for retry.
        enqueue(payload, false);
        setReviewOpen(false);
        addToast("Odoslanie zlyhalo — dodací list je uložený a skúsim znova.", "error");
        await resetForm();
        return;
      }

      // History is recorded server-side by /api/send-delivery (with real
      // send status); just refresh the list.
      window.dispatchEvent(new Event("delivery-sent"));

      setReviewOpen(false);
      addToast("Email s PDF bol odoslaný.", "success");

      // Reset form and go back to customer selection
      await resetForm();
    } catch (error: unknown) {
      // Network dropped mid-send — queue rather than lose the signed note.
      console.error("Email error:", error instanceof Error ? error.message : error);
      enqueue(
        {
          deliveryNumber,
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
          ccEmails: selectedCompany?.ccEmails ?? "",
        },
        needsNumber,
      );
      setReviewOpen(false);
      addToast("Bez pripojenia — dodací list je uložený a odošle sa po pripojení.", "success");
      await resetForm();
    } finally {
      setIsSendingEmail(false);
      isSendingRef.current = false;
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function resetForm() {
    // Peek the next number for the fresh form (the just-sent one was already
    // committed during send).
    let number = `DL-${todayISO().replace(/-/g, "")}-001`;
    try {
      const res = await fetch("/api/delivery-number");
      const data = await res.json();
      if (data.number) number = data.number;
    } catch { /* use fallback */ }
    viewTransition(() => dispatch({ type: "RESET_FORM", deliveryNumber: number }), true);
  }

  // Wrap screen-changing dispatches with View Transitions API
  function viewTransition(update: () => void, back = false) {
    if (document.startViewTransition) {
      if (back) document.documentElement.setAttribute("data-vt-back", "");
      const t = document.startViewTransition(() => flushSync(update));
      t.finished.then(() => document.documentElement.removeAttribute("data-vt-back"));
    } else {
      update();
    }
  }

  const handleSelectCompany = useCallback(
    (id: string) => {
      const company = state.companies.find((c) => c.id === id) ?? state.companies[0];
      viewTransition(() => dispatch({ type: "SELECT_COMPANY", id, company }));
    },
    [state.companies],
  );

  const handleSignatureChange = useCallback((data: string) => {
    dispatch({ type: "SET_FIELD", field: "signatureData", value: data });
  }, []);

  function handleSendClick() {
    if (!validate()) return;
    if (!state.signatureData) {
      addToast("Podpis zákazníka je povinný pre odoslanie", "error");
      return;
    }
    setReviewOpen(true);
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
      >
        Preskočiť na hlavný obsah
      </a>

      <ActionBar
        saveStatus={saveStatus}
        onGeneratePDF={generatePDF}
        onSendEmail={handleSendClick}
        onLogout={handleLogout}
        onLogoClick={() => viewTransition(() => dispatch({ type: "SET_SCREEN", screen: "customer-select" }), true)}
        canSendEmail={!!state.signatureData && !!state.customerEmail}
        isSendingEmail={isSendingEmail}
        isGeneratingPDF={isGeneratingPDF}
        showSendButton={state.screen === "delivery-form"}
        showPDFButton={state.screen === "delivery-form"}
      />

      <main id="main-content">
        <OutboxStatus />
        {state.screen === "customer-select" ? (
          <CustomerSelect
            companies={state.companies}
            isLoading={isLoading}
            onSelect={handleSelectCompany}
            onAddCompany={(data) =>
              dispatch({
                type: "ADD_COMPANY",
                company: { id: Date.now().toString(), ...data },
              })
            }
            onUpdateCompany={(id, data) =>
              dispatch({ type: "REPLACE_COMPANY", id, data })
            }
            onDeleteCompany={(id) =>
              dispatch({ type: "DELETE_COMPANY", id })
            }
          />
        ) : (
          <div className="mx-auto grid max-w-[1500px] grid-cols-1 items-start gap-3 px-3 py-3 pb-24 sm:gap-4 sm:px-6 sm:py-4 lg:grid-cols-[1.55fr_0.75fr] lg:pb-4">
            {/* Desktop: preview on left */}
            <div className="order-2 hidden lg:order-1 lg:block">
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

            {/* Form controls */}
            <div className="order-1 mx-auto w-full max-w-lg grid gap-3 sm:gap-4 lg:order-2 lg:max-w-none">
              <CompanyPanel
                customerName={state.customerName}
                customerEmail={state.customerEmail}
                onChangeCompany={() => viewTransition(() => dispatch({ type: "SET_SCREEN", screen: "customer-select" }), true)}
              />

              {lastOrder && state.quantity === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "SET_FIELD", field: "quantity", value: lastOrder.quantity });
                    dispatch({ type: "SET_FIELD", field: "freeQuantity", value: lastOrder.freeQuantity });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
                >
                  ↻ Zopakovať posledný: {lastOrder.quantity} ks
                  {lastOrder.freeQuantity > 0 ? ` (+${lastOrder.freeQuantity} grátis)` : ""}
                </button>
              )}

              <ItemsPanel
                deliveryNumber={state.deliveryNumber}
                date={state.date}
                quantity={state.quantity}
                freeQuantity={state.freeQuantity}
                priceWithVat={priceWithVat}
                note={state.note}
                onDeliveryNumberChange={(v) =>
                  dispatch({ type: "EDIT_DELIVERY_NUMBER", value: v })
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

              <DeliveryHistory />
            </div>
          </div>
        )}
      </main>

      {/* Sticky bottom bar — mobile only, visible on delivery form */}
      {state.screen === "delivery-form" && (
        <StickyBottomBar
          quantity={state.quantity}
          freeQuantity={state.freeQuantity}
          totalWithVat={calculations.totalWithVat}
          onSend={handleSendClick}
          canSend={!!state.signatureData && !!state.customerEmail && state.quantity > 0}
          hasSignature={!!state.signatureData}
          hasEmail={!!state.customerEmail}
        />
      )}

      {/* Review sheet */}
      <ReviewSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onConfirm={sendByEmail}
        isSending={isSendingEmail}
        supplier={supplier}
        selectedCompany={selectedCompany}
        customerName={state.customerName}
        customerEmail={state.customerEmail}
        deliveryNumber={state.deliveryNumber}
        date={state.date}
        quantity={state.quantity}
        freeQuantity={state.freeQuantity}
        calculations={calculations}
        priceWithVat={priceWithVat}
        signatureData={state.signatureData}
      />
    </div>
  );
}
