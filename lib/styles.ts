// Shared class vocabulary — one source of truth so the same control looks the
// same on every screen (impeccable product rule: consistent affordances).

const INPUT_BASE =
  "w-full min-h-[44px] rounded border bg-surface-alt px-3 py-3 text-base text-foreground placeholder:text-muted/70 transition-[border-color,box-shadow] focus:outline-none focus:border-border-strong focus:ring-2 focus:ring-accent/35";

export const INPUT_CLASSES = `${INPUT_BASE} border-border`;

export function inputClass(error?: string): string {
  return `${INPUT_BASE} ${error ? "border-danger ring-2 ring-danger/20" : "border-border"}`;
}

// Buttons — shared focus + press behaviour (Krehel: ~180ms, always a transition,
// scale on press for tactile feedback)
const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded font-bold transition-[background-color,border-color,transform,box-shadow,opacity,filter] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";

export const btn = {
  base: BTN_BASE,
  // Amber signal — the one primary action on a screen. Dark ink, hi-vis,
  // raised like a physical key.
  primary: `${BTN_BASE} bg-accent text-accent-ink shadow-[var(--elev-amber)] hover:bg-accent-hover hover:-translate-y-px active:translate-y-0`,
  secondary: `${BTN_BASE} border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-alt`,
  ghost: `${BTN_BASE} text-muted hover:bg-surface-alt hover:text-foreground`,
  danger: `${BTN_BASE} bg-danger text-white hover:opacity-90`,
} as const;

// Tabular mono for any meaningful number
export const numeric = "font-mono tabular-nums";
