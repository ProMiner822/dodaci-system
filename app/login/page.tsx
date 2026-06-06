"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../_components/ThemeToggle";
import { INPUT_CLASSES, btn } from "@/lib/styles";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Vyplňte meno aj heslo.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Nesprávne meno alebo heslo.");
        return;
      }

      router.push("/");
    } catch {
      setError("Nastala chyba. Skúste to znova.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="reveal w-full max-w-sm">
        {/* Manifest mark */}
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-accent font-mono text-lg font-bold text-accent-ink">
            T
          </span>
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-[0.16em] text-foreground">
              Tropic
            </h1>
            <p className="font-mono text-xs uppercase tracking-wide text-muted">
              Dodací systém
            </p>
          </div>
        </div>

        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-bold text-foreground"
              >
                Používateľské meno
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-bold text-foreground"
              >
                Heslo
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm font-semibold text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`${btn.primary} min-h-[48px] w-full text-base`}
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Prihlasujem…
                </>
              ) : (
                "Prihlásiť sa"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
