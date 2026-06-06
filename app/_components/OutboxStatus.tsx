"use client";

import { useEffect, useState } from "react";
import { queueCount, flushOutbox } from "@/lib/outbox";
import { btn } from "@/lib/styles";

// Shows how many signed deliveries are waiting to be sent (queued while
// offline) and lets the user retry immediately.
export default function OutboxStatus() {
  const [count, setCount] = useState(0);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setCount(queueCount());
    update();
    setOnline(navigator.onLine);

    const onOnline = () => { setOnline(true); update(); };
    const onOffline = () => setOnline(false);
    window.addEventListener("outbox-changed", update);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("outbox-changed", update);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (count === 0) return null;

  return (
    <div className="mx-auto mt-3 flex w-full max-w-xl items-center justify-between gap-3 rounded-lg border border-accent bg-accent-soft px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-bold text-foreground">
        <svg className="h-4 w-4 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>
          <span className="font-mono tabular-nums">{count}</span>{" "}
          {count === 1 ? "dodací list čaká" : "dodacie listy čakajú"}
          {online ? "" : " · offline"}
        </span>
      </span>
      <button
        type="button"
        onClick={() => flushOutbox()}
        disabled={!online}
        className={`${btn.primary} shrink-0 px-3 py-1.5 text-xs`}
      >
        Skúsiť teraz
      </button>
    </div>
  );
}
