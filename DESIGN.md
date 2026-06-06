# DESIGN.md — Tropic Dodací systém

Logistics / field-receipt system. Light-first, ink-on-warm-paper, mono numerals,
one amber signal colour. Implemented as CSS custom properties in
`app/globals.css` and mapped to Tailwind v4 tokens via `@theme inline`.

## Color (OKLCH)

Strategy: **Restrained** — tinted warm neutrals + a single amber accent used only
for the primary action and current selection. Never `#000`/`#fff`; every neutral
is tinted toward the warm paper hue (~88).

### Light (default — daylight field use)
| token | value | use |
|---|---|---|
| `--background` | `oklch(0.972 0.006 92)` | warm paper canvas |
| `--surface` | `oklch(0.996 0.004 92)` | raised sheets, sections |
| `--surface-alt` | `oklch(0.945 0.008 92)` | sunken inputs, fills |
| `--foreground` | `oklch(0.23 0.014 75)` | ink |
| `--muted` | `oklch(0.515 0.012 75)` | secondary text, labels |
| `--border` | `oklch(0.86 0.01 88)` | hairlines (1px) |
| `--border-strong` | `oklch(0.70 0.014 88)` | emphasized edges, focus |
| `--accent` | `oklch(0.74 0.16 67)` | amber signal |
| `--accent-hover` | `oklch(0.68 0.17 64)` | amber pressed |
| `--accent-ink` | `oklch(0.26 0.04 70)` | text **on** amber (dark, hi-vis) |
| `--accent-soft` | `oklch(0.95 0.038 82)` | amber wash / selected tint |
| `--success` / `--success-bg` | `oklch(0.58 0.13 150)` / `oklch(0.95 0.045 150)` | sent ok |
| `--danger` / `--danger-bg` | `oklch(0.55 0.19 27)` / `oklch(0.95 0.05 27)` | failed/invalid |

### Dark (tuned, not default — warm charcoal)
Same roles, lifted: bg `oklch(0.185 0.008 80)`, surface `oklch(0.22 0.009 80)`,
surface-alt `oklch(0.26 0.01 80)`, fg `oklch(0.92 0.01 85)`, muted
`oklch(0.66 0.012 85)`, border `oklch(0.33 0.012 82)`, border-strong
`oklch(0.46 0.014 82)`, accent `oklch(0.80 0.15 72)`, accent-ink
`oklch(0.20 0.04 70)`, accent-soft `oklch(0.32 0.05 72)`.

Text on amber is **always dark ink** (`--accent-ink`), never white — this is the
hi-vis safety-equipment look and the only contrast-correct choice.

## Typography

Two families, loaded with `next/font` (self-hosted, Slovak diacritics verified):
- **Hanken Grotesk** (`--font-sans`) — all labels, body, buttons, headings.
- **JetBrains Mono** (`--font-mono`) — every numeral that matters: quantities,
  prices, totals, delivery numbers, dates, codes. `font-variant-numeric: tabular-nums`.

Fixed rem scale (not fluid), ratio ~1.2. Headings carry weight contrast (700/800)
not size alone. The "receipt" signal lives in the mono numbers and the structure,
so sans body stays highly legible at small sizes.

## Shape & elevation

- Radius scale: `--r-sm` 6px, `--r` 8px, `--r-lg` 12px. No 16px+ blobs.
- **Borderless / canvas-first (Linear/Things direction).** Page content sits
  directly on the warm canvas, grouped by **hairline rules** (`border-border`,
  `border-y` to bound a group, `divide-y` between rows) and generous whitespace.
  Content is NOT wrapped in bordered + drop-shadow cards.
- **Elevation is meaningful, reserved only for layers that genuinely float**:
  native dialogs/sheets (ReviewSheet, CompanyModal, DocumentModal), the sticky
  bottom bar, toasts, the account popover, and the header's on-scroll scrim.
  These keep `bg-surface` + a border + `--elev-*` shadow so they read as lifted
  above the canvas. Everything else is flat.
- **Padding lives on containers, not rows.** Reusable rows (e.g. HistoryRow) are
  horizontally unpadded; their container provides `px-4`, so dividers read as
  inset list separators.
- Dashed borders only for true "add" affordances (add customer button).
- Floating buttons (primary amber) may carry `--elev-amber`; they're physical keys.

## Components

- Inputs: `surface-alt` fill, 1px border, focus → `border-strong` + 2px amber
  ring. min-height 44px (touch). Mono for numeric inputs.
- Primary button: amber fill, dark ink, weight 700. Secondary: bordered, surface.
  Destructive: danger text, danger-bg hover. Every control has hover/focus/
  active/disabled.
- Steppers/quantity: oversized mono numeral, hi-vis amber `+`, quiet `−`,
  quick-add chips.
- Selection (current customer): amber-soft fill + border-strong, not a checkmark.
- Empty states teach the next action; loading uses skeletons, not center spinners.

## Motion

150–220ms, ease-out. Conveys state only (reveal, selection, send progress).
Existing View Transitions between screens and `<dialog>` sheet transitions are
kept. No decorative/looping motion. `prefers-reduced-motion` respected.

## Off-limits

The delivery-note PDF (`lib/pdf.ts`) and its on-screen mirror `PreviewContent`
stay black-ink-on-white with their current structure — it is the legal artifact.
