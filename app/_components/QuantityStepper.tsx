"use client";

import { useCallback, useRef, useState } from "react";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
  error?: string;
  size?: "lg" | "sm";
}

export default function QuantityStepper({
  value,
  onChange,
  min = 0,
  label,
  error,
  size = "lg",
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
  const numSize = isLarge
    ? "text-5xl sm:text-6xl"
    : "text-3xl sm:text-4xl";

  return (
    <div>
      <div className="mb-2 text-sm font-bold">{label}</div>
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => { onChange(Math.max(min, value - 1)); haptic(); }}
          onPointerDown={() => startRepeat(-1)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          disabled={value <= min}
          className={`${btnSize} flex shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-surface font-bold text-foreground shadow-sm transition-all hover:bg-surface-alt active:scale-95 disabled:opacity-30 disabled:active:scale-100`}
          aria-label={`Znížiť ${label}`}
        >
          &minus;
        </button>

        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            className={`${numSize} w-[4ch] border-b-2 border-accent bg-transparent text-center font-bold tabular-nums outline-none`}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className={`${numSize} min-w-[3ch] cursor-text text-center font-bold tabular-nums rounded-lg transition-colors hover:bg-surface-alt`}
            aria-label={`Upraviť ${label}: ${value}`}
          >
            {value}
          </button>
        )}

        <button
          type="button"
          onClick={() => { onChange(value + 1); haptic(); }}
          onPointerDown={() => startRepeat(1)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          className={`${btnSize} flex shrink-0 items-center justify-center rounded-2xl border-2 border-accent bg-accent/10 font-bold text-accent shadow-sm transition-all hover:bg-accent/20 active:scale-95`}
          aria-label={`Zvýšiť ${label}`}
        >
          +
        </button>
      </div>
      {error && (
        <span role="alert" className="mt-2 block text-center text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
