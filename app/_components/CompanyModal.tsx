"use client";

import { useEffect, useRef, useState } from "react";
import type { Company } from "@/lib/types";
import { formatEUR, formatDateSK, todayISO } from "@/lib/formatting";
import { btn } from "@/lib/styles";

interface CompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (company: Omit<Company, "id">) => void;
  onDelete?: () => void;
  initialData?: Company | null;
}

const inputClasses =
  "w-full min-h-[44px] rounded border bg-surface-alt px-3 py-3 text-base text-foreground placeholder:text-muted/70 transition-[border-color,box-shadow] focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/35";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CompanyModal({
  open,
  onClose,
  onSave,
  onDelete,
  initialData,
}: CompanyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [address, setAddress] = useState("");
  const [ico, setIco] = useState("");
  const [dic, setDic] = useState("");
  const [icdph, setIcdph] = useState("");
  const [priceWithVat, setPriceWithVat] = useState("1.85");

  // Open/close dialog via native API
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      setName(initialData?.name ?? "");
      setEmail(initialData?.email ?? "");
      setCcEmails(initialData?.ccEmails ?? "");
      setAddress(initialData?.address ?? "");
      setIco(initialData?.ico ?? "");
      setDic(initialData?.dic ?? "");
      setIcdph(initialData?.icdph ?? "");
      setPriceWithVat(initialData?.priceWithVat?.toString() ?? "1.85");
      setErrors({});
      setConfirmingDelete(false);
      requestAnimationFrame(() => nameRef.current?.focus());
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open, initialData]);

  // Cmd+Enter to submit
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Názov firmy je povinný";
    if (!email.trim() || !EMAIL_RE.test(email))
      newErrors.email = "Zadajte platný email";
    const ccInvalid = ccEmails
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .some((addr) => !EMAIL_RE.test(addr));
    if (ccInvalid) newErrors.ccEmails = "Niektorý z CC emailov je neplatný";
    const price = parseFloat(priceWithVat);
    if (isNaN(price) || price <= 0)
      newErrors.priceWithVat = "Cena musí byť väčšia ako 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const newPrice = parseFloat(priceWithVat);
    const priceChanged = !!initialData && initialData.priceWithVat !== newPrice;
    onSave({
      name: name.trim(),
      email: email.trim(),
      ccEmails: ccEmails.trim(),
      address: address.trim(),
      ico: ico.trim(),
      dic: dic.trim(),
      icdph: icdph.trim(),
      priceWithVat: newPrice,
      // Record the prior price when it changes; otherwise carry forward.
      previousPrice: priceChanged ? initialData!.priceWithVat : initialData?.previousPrice,
      priceChangedAt: priceChanged ? todayISO() : initialData?.priceChangedAt,
    });
  }

  const isEdit = !!initialData;

  return (
    <dialog
      ref={dialogRef}
      className="dialog-bottom-sheet w-full max-w-md rounded-t-lg border border-border bg-surface text-foreground shadow-xl lg:rounded-lg"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 lg:hidden">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {isEdit ? "Upraviť firmu" : "Pridať firmu"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zavrieť"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border/30 hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label htmlFor="modal-name" className="mb-1.5 block text-sm font-bold">
              Názov firmy
            </label>
            <input
              ref={nameRef}
              id="modal-name"
              className={`${inputClasses} ${errors.name ? "border-danger" : "border-border"}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "modal-name-error" : undefined}
            />
            {errors.name && (
              <span id="modal-name-error" role="alert" className="mt-1 block text-xs text-danger">
                {errors.name}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="modal-email" className="mb-1.5 block text-sm font-bold">
              Email
            </label>
            <input
              id="modal-email"
              type="email"
              autoComplete="email"
              className={`${inputClasses} ${errors.email ? "border-danger" : "border-border"}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "modal-email-error" : undefined}
            />
            {errors.email && (
              <span id="modal-email-error" role="alert" className="mt-1 block text-xs text-danger">
                {errors.email}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="modal-cc" className="mb-1.5 block text-sm font-bold">
              Kópia e-mailu (CC) <span className="font-normal text-muted">— nepovinné</span>
            </label>
            <input
              id="modal-cc"
              className={`${inputClasses} ${errors.ccEmails ? "border-danger" : "border-border"}`}
              value={ccEmails}
              onChange={(e) => setCcEmails(e.target.value)}
              placeholder="napr. manazer@firma.sk, uctovnik@firma.sk"
              aria-invalid={!!errors.ccEmails}
              aria-describedby={errors.ccEmails ? "modal-cc-error" : undefined}
            />
            {errors.ccEmails ? (
              <span id="modal-cc-error" role="alert" className="mt-1 block text-xs text-danger">
                {errors.ccEmails}
              </span>
            ) : (
              <span className="mt-1 block text-xs text-muted">
                Viac adries oddeľte čiarkou. Pridajú sa do kópie každého dodacieho listu.
              </span>
            )}
          </div>

          <div>
            <label htmlFor="modal-address" className="mb-1.5 block text-sm font-bold">
              Adresa
            </label>
            <input
              id="modal-address"
              className={`${inputClasses} border-border`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="modal-ico" className="mb-1.5 block text-sm font-bold">
                IČO
              </label>
              <input
                id="modal-ico"
                className={`${inputClasses} border-border`}
                value={ico}
                onChange={(e) => setIco(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="modal-dic" className="mb-1.5 block text-sm font-bold">
                DIČ
              </label>
              <input
                id="modal-dic"
                className={`${inputClasses} border-border`}
                value={dic}
                onChange={(e) => setDic(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="modal-icdph" className="mb-1.5 block text-sm font-bold">
                IČ DPH
              </label>
              <input
                id="modal-icdph"
                className={`${inputClasses} border-border`}
                value={icdph}
                onChange={(e) => setIcdph(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="modal-price" className="mb-1.5 block text-sm font-bold">
              Cena za kus s DPH
            </label>
            <input
              id="modal-price"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              className={`${inputClasses} ${errors.priceWithVat ? "border-danger" : "border-border"}`}
              value={priceWithVat}
              onChange={(e) => setPriceWithVat(e.target.value)}
              aria-invalid={!!errors.priceWithVat}
              aria-describedby={errors.priceWithVat ? "modal-price-error" : undefined}
            />
            {errors.priceWithVat && (
              <span id="modal-price-error" role="alert" className="mt-1 block text-xs text-danger">
                {errors.priceWithVat}
              </span>
            )}
            {!errors.priceWithVat &&
              initialData?.previousPrice != null &&
              initialData?.priceChangedAt && (
                <span className="mt-1 block text-xs text-muted">
                  Predtým {formatEUR(initialData.previousPrice)} · zmenené{" "}
                  {formatDateSK(initialData.priceChangedAt)}
                </span>
              )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            {onDelete && !confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-bg"
              >
                Odstrániť
              </button>
            )}
            {onDelete && confirmingDelete && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-danger">Naozaj?</span>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-border/30"
                >
                  Zrušiť
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="min-h-[44px] rounded-lg bg-danger px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-danger/90"
                >
                  Odstrániť
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`${btn.secondary} min-h-[40px] px-4 py-2 text-sm`}
            >
              Zrušiť
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={`${btn.primary} min-h-[40px] px-4 py-2 text-sm`}
            >
              {isEdit ? "Uložiť" : "Pridať"}
            </button>
          </div>
        </div>

        <p className="mt-3 hidden text-center text-xs text-muted sm:block">
          {"\u2318"}Enter na uloženie &middot; Esc na zatvorenie
        </p>
        </div>
      </div>
    </dialog>
  );
}
