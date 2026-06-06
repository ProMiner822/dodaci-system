"use client";

import { useEffect, useState } from "react";
import { queueCount, flushOutbox } from "@/lib/outbox";

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
    <div className="mx-auto mt-3 flex w-full max-w-lg items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 lg:max-w-2xl">
      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
        {count} {count === 1 ? "dodací list čaká" : "dodacie listy čakajú"} na odoslanie
        {online ? "" : " · ste offline"}
      </span>
      <button
        type="button"
        onClick={() => flushOutbox()}
        disabled={!online}
        className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
      >
        Skúsiť teraz
      </button>
    </div>
  );
}
