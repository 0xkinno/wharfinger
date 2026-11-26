# Submission pack: Telegraph Hackathon Season II

Pre-filled answers for the final form, which the organisers say opens near the end of the hackathon (deadline 2026-12-01 23:59 UTC;
submit at least two hours early). Everything below is checked against the repository.

## Project details

| Field | Answer |
|---|---|
| Project name | Wharfinger |
| Track | Apps & Agents |
| Mission | 08 Commodities (bounties issue 196) |
| Tagline | Every disputed hour of a port call, with a receipt the shipowner can check. |
| Live app | https://wharfinger-kinnoskis-projects.vercel.app |
| Repository | https://github.com/0xkinno/wharfinger (MIT) |
| GitHub username (starred the bounties repo) | 0xkinno |
| Network | Telegraph testnet (Sepolia). Nothing here is mainnet. |
| Demo video | to be added after recording (kept in `reference/video/`, not in the repository) |
| Run it | `pnpm install && pnpm verify examples/statement.sample.json`; hosted path `/judge` |

## Short public summary

Wharfinger watches a ship in port and buys vessel position, port queue and weather facts on Telegraph while they are still true.
Code classifies every hour of the stay as counting, excepted or review; the analyst signs; the shipowner recomputes every line
from the stored receipts and signals, in a browser or offline. Wrong, stale and empty miner answers are refused and re-bought, and
operators that relay one public feed are labelled as one upstream.

## Evidence to point at

| Claim | Where |
|---|---|
| Real paid answers with receipts and signal hashes | `/voyage/iceland-fiktk-preloaded`, `/evidence` |
| Browser recompute PASS, and FAIL after a one minute change | `/verify/iceland-fiktk-preloaded`, `/judge` |
| Real wallet flows end to end | `node e2e/wallet.mjs` (ALL PASSED on 2026-11-26) |
| Six viewport browser suite | `node e2e/smoke.mjs` (ALL PASSED) |
| 117 unit and property tests | `pnpm test` |
| Settlement gate, four real decisions, one Solana devnet payment | `/settle`, [transaction](https://explorer.solana.com/tx/3uAkgU3WL2E1XrXA9JZ5ckaJhKaciMCxKu8ubRjv68iZcRTMp141VcDcAWqMVM2fcAGKQHrCjpNFDA2T6SfQ15M5?cluster=devnet), `evidence/settlement/run.json` |
| What the network got wrong | `PLATFORM_PROBE.md`, `FINDINGS.md`, `FRICTION_REPORT.md` |

## Commercial summary

1. Who is it for? Post-fixture demurrage analysts at physical commodity trading desks.
2. What does it improve? Replaces a retyped, handwritten Statement of Facts with receipts the owner can recompute. About $0.01
   per answer and an estimated $1.20 to $1.60 per 48 hour stay.
3. What does it do today? Watches, buys, checks, classifies, signs, verifies, exports PDF, XLSX and JSON. Testnet only.
4. Why adopt it? Demurrage disputes are won on timestamped evidence and lost on time bars. Missing: chart-derived port limits,
   independent position sources, a real customer.
5. How can someone try it? The live app and `pnpm verify`.

## Showcase permission and disclosures

Showcase permission: yes. Built with substantial AI assistance (`DISCLOSURES.md`). Hackathon entry; the prize incentive applies.

## Honest status

Done since the first draft: settlement gate (`/settle`, `packages/settle`) with two real screening receipts; a released payment on Solana devnet read back from the chain; an unattended production voyage (MV Kraftca) started and ticking; the Mission 08 issue body read and mapped.

Not done: the unattended voyage finishing at sailing, six week replay, Visa CLI rail, Pay.sh, red team rounds, evaluator and miner
entries, H2 gallery check, BIMCO text, chart-derived port limits, `executeWithdraw` sweep (requested, waits
for the node's ledger root). None of these is claimed anywhere in the app or the README.

## Other tracks

Miner (Track 02): Wharfinger Port Queue, `LIVE_PORT_CONGESTION_GENERAL`, see `MINER.md`. Evaluator (Track 03): 28 real preference pairs for `VESSEL_TELEMETRY_VERIFY_GENERAL`, see `EVALUATOR.md`. Registration and upload IDs go here once the owner has done both on Anjoman.

## Before submitting

1. List Wharfinger in the Anjoman Apps directory (https://anjoman.ai/dashboard/apps): description, repository, live URL; update it
   when the video exists. The organisers asked for this before the final form.
2. Post in the Discord `showcase` channel with the live link, repository and screenshots.
3. Reply in the Commercial Use Cases thread with the use case, what is built and what is not (see `GROWTH.md`).
4. Fill the final form from this file when it opens.
