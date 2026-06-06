"use client";

import { useCallback, useRef, useState } from "react";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
  error?: string;
  size?: "lg" | "sm";
  quickAdd?: number[];
}

export default function QuantityStepper({
  value,
  onChange,
  min = 0,
  label,
  error,
  size = "lg",
  quickAdd,
}: QuantityStepperProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  function haptic() {
    navigator.vibrate?.(10);
  }

  const stopRepeat = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const startRepeat = useCallback(
    (delta: number) => {
      stopRepeat();
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          const next = Math.max(min, valueRef.current + delta);
          onChange(next);
          haptic();
        }, 100);
      }, 400);
    },
    [onChange, min, stopRepeat],
  );

  function startEditing() {
    setEditValue(value.toString());
    setIsEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.select();
    });
  }

  function commitEdit() {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed >= min) {
      onChange(parsed);
    }
    setIsEditing(false);
  }

  const isLarge = size === "lg";
  const btnSize = isLarge
    ? "h-14 w-14 text-2xl sm:h-16 sm:w-16 sm:text-3xl"
    : "h-11 w-11 text-xl";
  const numSize = isLarge ? "text-6xl sm:text-7xl" : "text-3xl sm:text-4xl";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          {label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-center sm:gap-6">
        <button
          type="button"
          onClick={() => {
            onChange(Math.max(min, value - 1));
            haptic();
          }}
          onPointerDown={() => startRepeat(-1)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={value <= min}
          className={`${btnSize} flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface font-bold text-foreground transition-all hover:border-border-strong hover:bg-surface-alt active:scale-95 disabled:opacity-30 disabled:active:scale-100`}
          aria-label={`Znížiť ${label}`}
        >
          &minus;
        </button>

        {/* Number cell — fixed flex track so the giant glyphs never overflow
            the row (a bare number input reports a huge intrinsic width). */}
        <div className="flex min-w-0 flex-1 justify-center sm:flex-none sm:basis-[4ch]">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`${numSize} w-full min-w-0 border-b-2 border-accent bg-transparent text-center font-mono font-bold leading-none tabular-nums outline-none`}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
              autoFocus
            />
          ) : (
            <button
              key={value}
              type="button"
              onClick={startEditing}
              className={`num-pop ${numSize} w-full min-w-0 cursor-text rounded text-center font-mono font-bold leading-none tabular-nums transition-colors hover:bg-surface-alt ${value === 0 ? "text-muted/40" : "text-foreground"}`}
              aria-label={`Upraviť ${label}: ${value}`}
            >
              {value}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onChange(value + 1);
            haptic();
          }}
          onPointerDown={() => startRepeat(1)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          className={`${btnSize} flex shrink-0 items-center justify-center rounded-lg bg-accent font-bold text-accent-ink shadow-[var(--elev-amber)] transition-all duration-150 hover:bg-accent-hover hover:-translate-y-px active:translate-y-0 active:scale-95`}
          aria-label={`Zvýšiť ${label}`}
        >
          +
        </button>
      </div>

      {quickAdd && quickAdd.length > 0 && (
        <div className="mt-4 flex justify-center gap-2">
          {quickAdd.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                onChange(value + step);
                haptic();
              }}
              className="min-h-[40px] flex-1 rounded-lg border border-border bg-surface px-2 font-mono text-sm font-bold tabular-nums text-foreground transition-colors hover:border-border-strong hover:bg-surface-alt active:scale-95"
            >
              +{step}
            </button>
          ))}
        </div>
      )}

      {error && (
        <span role="alert" className="mt-2 block text-center text-xs font-semibold text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
