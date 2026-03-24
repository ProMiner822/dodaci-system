"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "dodaci-system-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ["system", "light", "dark"].includes(stored)) {
      setTheme(stored);
      applyTheme(stored);
    }
  }, []);

  const cycle = useCallback(() => {
    const next: Theme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-alt hover:text-foreground"
      aria-label={`Téma: ${theme === "system" ? "systémová" : theme === "light" ? "svetlá" : "tmavá"}`}
      title={theme === "system" ? "Systémová" : theme === "light" ? "Svetlá" : "Tmavá"}
    >
      {theme === "system" && (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      )}
      {theme === "light" && (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      )}
      {theme === "dark" && (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}
