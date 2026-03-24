"use client";

import ThemeToggle from "./ThemeToggle";
import Spinner from "./Spinner";

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
}: ActionBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface print:hidden">
      <div className="mx-auto flex h-13 max-w-[1500px] items-center justify-between px-3 sm:h-14 sm:px-6">
        {/* Left — Brand + Page Context */}
        <button
          type="button"
          onClick={onLogoClick}
          className="flex items-center gap-2.5 rounded-lg p-1 -ml-1 transition-colors hover:bg-surface-alt active:scale-[0.98]"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-xs font-bold text-white">
            T
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight">
              Tropic
            </span>
            <span className="hidden text-xs text-muted sm:inline">/</span>
            <span className="hidden text-xs font-medium text-muted sm:inline">
              Dodací list
            </span>
          </div>
        </button>

        {/* Right — Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Save status */}
          {showPDFButton && saveStatus !== "idle" && (
            <span className="hidden text-xs text-muted sm:inline">
              {saveStatus === "saving" ? "Ukladám..." : "Uložené"}
            </span>
          )}

          {showPDFButton && (
            <button
              type="button"
              onClick={onGeneratePDF}
              disabled={isGeneratingPDF}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] sm:px-2.5 sm:text-sm"
            >
              {isGeneratingPDF ? (
                <Spinner size="sm" />
              ) : (
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
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
              className="hidden items-center gap-1.5 rounded-lg bg-accent px-2.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] lg:inline-flex lg:h-8 lg:px-3 lg:text-sm"
            >
              {isSendingEmail ? (
                <Spinner size="sm" />
              ) : (
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
              <span>
                {isSendingEmail ? "Odosielam..." : "Odoslať email"}
              </span>
            </button>
          )}

          {/* Divider */}
          <div className="mx-0.5 hidden h-5 w-px bg-border sm:block" />

          {/* Utility actions */}
          <ThemeToggle />

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted transition-colors hover:bg-surface-alt hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-2.5 sm:text-sm"
          >
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">Odhlásiť</span>
          </button>
        </div>
      </div>
    </header>
  );
}
