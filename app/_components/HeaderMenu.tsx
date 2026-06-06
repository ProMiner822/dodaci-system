"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Theme = "system" | "light" | "dark";
const STORAGE_KEY = "dodaci-system-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "Systém",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    value: "light",
    label: "Svetlá",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Tmavá",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
];

export default function HeaderMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const s = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return s === "light" || s === "dark" || s === "system" ? s : "system";
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = useCallback((t: Theme) => {
    setTheme(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Účet a nastavenia"
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95 ${
          open
            ? "border-border-strong bg-surface-alt text-foreground"
            : "border-border text-muted hover:border-border-strong hover:text-foreground"
        }`}
      >
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="swap-in absolute right-0 top-full z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-lg border border-border bg-surface p-1.5 shadow-[var(--elev-2)]"
        >
          <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-muted">
            Téma
          </div>
          <div className="mb-1.5 grid grid-cols-3 gap-1 px-1">
            {THEMES.map((t) => {
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => choose(t.value)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1.5 rounded-md border px-1 py-2 text-[11px] font-bold transition-colors ${
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-transparent text-muted hover:bg-surface-alt hover:text-foreground"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="mx-1 my-1 h-px bg-border" />

          <Link
            href="/archiv"
            role="menuitem"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-alt"
            onClick={() => setOpen(false)}
          >
            <svg className="h-4 w-4 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7h18M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 11h6" />
            </svg>
            História a súhrn
          </Link>

          <div className="mx-1 my-1 h-px bg-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-danger-bg hover:text-danger"
          >
            <svg className="h-4 w-4 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Odhlásiť sa
          </button>
        </div>
      )}
    </div>
  );
}
