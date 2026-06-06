"use client";

interface SuccessOverlayProps {
  customerName: string;
  deliveryNumber: string;
  queued?: boolean;
}

// The closing beat of a delivery: a brief, satisfying confirmation before the
// app returns to the customer list for the next stop on the round.
export default function SuccessOverlay({
  customerName,
  deliveryNumber,
  queued,
}: SuccessOverlayProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 px-6 backdrop-blur-sm">
      <div className="reveal flex flex-col items-center text-center">
        <span
          className={`check-ring flex h-20 w-20 items-center justify-center rounded-full ${
            queued ? "bg-accent-soft text-accent" : "bg-success-bg text-success"
          }`}
        >
          {queued ? (
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <polyline className="check-draw" points="12 7 12 12 16 14" />
            </svg>
          ) : (
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline className="check-draw" points="5 13 10 18 19 7" />
            </svg>
          )}
        </span>
        <p className="mt-5 text-xl font-extrabold tracking-tight">
          {queued ? "Uložené — odošle sa" : "Odoslané"}
        </p>
        <p className="mt-1 font-mono text-sm tabular-nums text-muted">
          {deliveryNumber}
        </p>
        <p className="mt-0.5 max-w-[16rem] truncate text-sm text-muted">
          {customerName}
        </p>
      </div>
    </div>
  );
}
