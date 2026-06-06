"use client";

import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import HeaderMenu from "./HeaderMenu";
import { btn } from "@/lib/styles";

interface ActionBarProps {
  saveStatus: "idle" | "saving" | "saved";
  onGeneratePDF: () => void;
  onSendEmail: () => void;
  onLogout: () => void;
  onLogoClick?: () => void;
  canSendEmail: boolean;
  isSendingEmail: boolean;
  isGeneratingPDF: boolean;
  showSendButton?: boolean;
  showPDFButton?: boolean;
  deliveryNumber?: string;
}

export default function ActionBar({
  saveStatus,
  onGeneratePDF,
  onSendEmail,
  onLogout,
  onLogoClick,
  canSendEmail,
  isSendingEmail,
  isGeneratingPDF,
  showSendButton = true,
  showPDFButton = true,
  deliveryNumber,
}: ActionBarProps) {
  const onForm = showSendButton || showPDFButton;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-surface/80 backdrop-blur-md transition-[box-shadow,border-color,background-color] duration-300 print:hidden ${
        scrolled
          ? "border-border bg-surface/90 shadow-[var(--elev-1)]"
          : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between gap-2 px-3 sm:px-6">
        {/* Detail view (form): back to the customer picker.
            Hub: brand mark. The logo-becomes-back pattern. */}
        {onForm ? (
          <button
            type="button"
            onClick={onLogoClick}
            className="-ml-1.5 flex min-w-0 items-center gap-1 rounded p-1.5 pr-2.5 text-sm font-bold transition-colors hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
          >
            <svg className="h-5 w-5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="truncate">Odberatelia</span>
            {deliveryNumber && (
              <span className="hidden truncate pl-1.5 font-mono text-xs font-medium text-muted sm:inline">
                {deliveryNumber}
              </span>
            )}
          </button>
        ) : (
          <div className="flex min-w-0 items-center gap-2.5 p-1">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-accent font-mono text-sm font-bold text-accent-ink">
              T
            </span>
            <span className="text-sm font-extrabold uppercase tracking-[0.16em]">
              Tropic
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {showPDFButton && saveStatus !== "idle" && (
            <span className="mr-1 hidden items-center gap-1.5 text-xs text-muted sm:flex">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  saveStatus === "saved" ? "bg-success" : "bg-border-strong animate-pulse"
                }`}
                aria-hidden="true"
              />
              {saveStatus === "saving" ? "Ukladám" : "Uložené"}
            </span>
          )}

          {showPDFButton && (
            <button
              type="button"
              onClick={onGeneratePDF}
              disabled={isGeneratingPDF}
              className={`${btn.ghost} min-h-[44px] min-w-[44px] px-2 text-sm sm:px-3`}
            >
              {isGeneratingPDF ? (
                <Spinner size="sm" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 18 15 15" />
                </svg>
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          {showSendButton && (
            <button
              type="button"
              onClick={onSendEmail}
              disabled={!canSendEmail || isSendingEmail}
              className={`${btn.primary} h-9 px-3.5 text-sm max-lg:hidden`}
            >
              {isSendingEmail ? (
                <Spinner size="sm" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
              <span>{isSendingEmail ? "Odosielam" : "Odoslať"}</span>
            </button>
          )}

          {(showPDFButton || showSendButton) && (
            <div className="mx-0.5 hidden h-5 w-px bg-border sm:block" />
          )}

          <HeaderMenu onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}
