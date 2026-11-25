# DESIGN

A harbourmaster's ledger printed on ash-white paper, lit by a cold dawn: navy ink, one electric cyan signal colour, brass for
seals and signatures. Editorial layout, generous margins, hairline rules, tracked small caps, numerals set like a time sheet.
Calm and premium; never a dark crypto dashboard.

## Tokens

| Token | Value | Role |
|---|---|---|
| `--ink-harbour` | `#0B1B33` | Text, primary buttons, navbar capsule |
| `--paper-ash` | `#F3F1EC` | Page background with a faint radial glow and paper grain |
| `--signal` | `#19D3FF` | The one accent per view: live state, focus, hover glow |
| `--brass` | `#C29A45` | Seals, signatures, AGREED |
| `--flag` | `#E5484D` | Demurrage running, REFUSED. Never decorative |
| `--hairline` | `#E6E2D8` | Rules and card borders |
| `--muted` | `#5B6B82` | Secondary text. Contrast on paper is 5.0:1 |
| `--card` | `#FFFFFF` | Cards |

## Type

- Display: Fraunces Variable (self-hosted through `@fontsource-variable/fraunces`), headlines and big numerals.
- UI: **Instrument Sans Variable** (`@fontsource-variable/instrument-sans`). The build instruction names Satoshi from
  Fontshare, which is distributed as a licence-gated download that the build environment cannot fetch. Instrument Sans is
  the substitute; it is not Inter. Swap in Satoshi by dropping the woff2 in `public/fonts` and editing `globals.css`.
- Mono: IBM Plex Mono for receipts, hashes, times and the time sheet.
- Scale: 12, 14, 16, 18, 22, 28, 36, 48, 64, 88 px. Small caps labels 11 to 12 px, tracking 0.12em.

## Components

- Card: white, 1 px hairline, 24 px radius, layered soft shadow, cyan pointer glow on hover (`--mx`, `--my`).
- Navbar: square capsule (14 px radius), centred, sticky, 56 px. Active link is a filled ink capsule. Right side: network
  chip (measured, from `/api/status`), wallet button, and a power icon to disconnect.
- Status chips: WATCHING, ON DEMURRAGE, REVIEW n, SIGNED, AGREED, DISPUTED, REFUSED, STALE, BUDGET SPENT, BLOCK PENDING.
  Every one has a designed state, not only success.
- Receipt card: miner, operator, source family, cost, latency, signal link, receipt hash, epoch, the three clocks, verdict.

## Honesty rules in the interface

- Real data is labelled real; the persona and illustrative SOF are labelled illustrative; public records say "public
  record, not bought on Telegraph".
- `ONE_UPSTREAM` is shown wherever corroborating operators share a feed.
- Nothing hard-coded for status: `/api/status` measures the node, escrow, database and last tick.

## Accessibility and layout

Colour is never the only signal; focus rings use `--signal`; motion respects `prefers-reduced-motion`; no horizontal
scroll at 375 px; art never overlaps text (`data-art` and `data-text` boxes are checked in the Playwright suite).
