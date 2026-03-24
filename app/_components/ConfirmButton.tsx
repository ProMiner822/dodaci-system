"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ConfirmButtonProps {
  children: React.ReactNode;
  confirmText?: string;
  onConfirm: () => void;
  className?: string;
  confirmClassName?: string;
  timeoutMs?: number;
}

export default function ConfirmButton({
  children,
  confirmText = "Potvrdiť?",
  onConfirm,
  className = "",
  confirmClassName = "",
  timeoutMs = 3000,
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setConfirming(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => reset(), [reset]);

  function handleClick() {
    if (confirming) {
      reset();
      onConfirm();
    } else {
      setConfirming(true);
      timeoutRef.current = setTimeout(reset, timeoutMs);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={confirming ? confirmClassName || className : className}
    >
      {confirming ? confirmText : children}
    </button>
  );
}
