"use client";

interface ActionBarProps {
  onSave: () => void;
  onGeneratePDF: () => void;
  onSendEmail: () => void;
  canSendEmail: boolean;
  isSendingEmail: boolean;
  isGeneratingPDF: boolean;
}

export default function ActionBar({
  onSave,
  onGeneratePDF,
  onSendEmail,
  canSendEmail,
  isSendingEmail,
  isGeneratingPDF,
}: ActionBarProps) {
  return (
    <div className="mx-auto mb-4 max-w-[1500px]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Dodací list</h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Vyplňte formulár, podpíšte a odošlite email.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
          <button
            type="button"
            onClick={onSave}
            className="min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-bold transition-colors hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] sm:px-4 sm:py-3 sm:text-base"
          >
            Uložiť
          </button>

          <button
            type="button"
            onClick={onGeneratePDF}
            disabled={isGeneratingPDF}
            className="min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-bold transition-colors hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] sm:px-4 sm:py-3 sm:text-base"
          >
            {isGeneratingPDF ? "..." : "PDF"}
          </button>

          <button
            type="button"
            onClick={onSendEmail}
            disabled={!canSendEmail || isSendingEmail}
            className="min-h-[44px] rounded-lg border border-accent bg-accent px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] sm:px-4 sm:py-3 sm:text-base"
          >
            {isSendingEmail ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span className="hidden sm:inline">Odosielam...</span>
              </span>
            ) : (
              <>
                <span className="sm:hidden">Email</span>
                <span className="hidden sm:inline">Odoslať email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
