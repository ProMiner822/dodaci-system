# PRODUCT.md — Tropic Dodací systém

register: product

## Product purpose

A field tool for issuing **delivery notes** ("dodacie listy") for **Tropic** (Adrián
Zachar), a Bratislava supplier of fresh avocados (Avokádo hass) to restaurant
chains. One delivery = one screen: pick the customer, enter how many crates were
handed over, the customer signs on the phone, the app emails a signed PDF and
records it. It must work at a loading dock with one hand and a flaky signal.

The delivery note is a real tax/accounting document. Its PDF layout and numbers
are not up for reinvention. Everything *around* that document is.

## Users

- **The supplier / driver.** Issues the note at the point of delivery, on a
  phone, often outdoors or in a kitchen. Wants the fewest taps between "arrived"
  and "sent". Knows the customers by heart.
- **The restaurant manager.** Touches the app once: to sign with a finger on a
  phone handed across a counter. Must instantly understand what they're signing
  and how much.
- **The office (occasionally, on desktop).** Reviews history, re-sends, exports a
  monthly summary for the accountant.

## Strategic principles

- **Speed is the feature.** The paid-quantity entry and the signature are the
  only two things that change per delivery. They get the screen. Everything else
  collapses, defaults, or remembers.
- **Trust through legibility.** A signed financial document handed to a customer
  must read as precise and official, never toy-like. Big numbers, exact totals,
  clear who-owes-what.
- **Resilient by default.** Offline queueing, autosave, re-entry guards already
  exist. The UI must always tell the truth about send state.
- **Slovak, always.** All copy is Slovak. Diacritics must render in every font.

## Brand & tone

Tropic is a small, serious produce business, not a SaaS startup. Tone:
plain, confident, operational. Labels read like a delivery slip, not a marketing
site. No exclamation points, no "Oops!", no emoji in the UI.

## Visual direction (locked)

**Logistics / field receipt.** Light-first and daylight-readable (primary use is
outdoors / handing the phone over). Ink-on-warm-paper. Crisp full borders, not
floating drop-shadow cards. Monospace **tabular** numerals carry every quantity,
price, total and delivery number, the structure reads like a precise shipping
slip. One bold **amber** signal colour (ripe-avocado amber, hi-vis like safety
equipment) for the primary action and current selection only. Dark theme is
retained and tuned, not the default.

## Anti-references (what this must NOT look like)

- Generic blue Tailwind SaaS dashboard (its current state).
- Produce-category reflex: leafy green everywhere, a leaf logo, "farm fresh"
  script fonts.
- Floating-card soup: every block a rounded white card with a drop shadow.
- Hero-metric template, gradient text, glassmorphism, side-stripe accents.
- Anything a stranger would caption "an AI made this".
