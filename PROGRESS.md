# PROGRESS

Self-judging after each phase (build instruction section 18). A "no" stops polishing. Scored honestly; nothing is
built yet, so most answers describe the design.

## After Phase 0 and Phase 1 (2026-11-25)

| # | Question | Answer | Basis |
|---|---|---|---|
| 1 | Can a non-technical person repeat the problem after 10 seconds of the landing page? | not applicable yet | No UI. `BEAT.md` language is ready |
| 2 | Does a real Telegraph purchase happen autonomously, unattended, and move a priced hour? | **no** | No paid ask has been made. The probe wallet is unfunded |
| 3 | Does Mira do something software cannot (attach the SOF, resolve REVIEW, sign)? | design only | `MOMENT.md` and `THESIS.md` are Phase 2 |
| 4 | Does the owner recompute a statement without trusting us, online and offline? | partly | The signal hash recompute works offline on a real signal. Statement recompute is Phase 6 |
| 5 | Is every sponsor feature named only where it is called, with file:line in `SDK_SURFACE.md`? | not applicable yet | No product code calls Telegraph. `SDK_SURFACE.md` starts in Phase 4 |
| 6 | Is every headline number from FACTS or a live endpoint, with misses named? | not applicable yet | No headline numbers exist. Every number in the probe docs is traceable to a file in `evidence/probe/` |
| 7 | Can a judge see a real corroborated fact with receipts in 60 seconds? | **no** | Nothing is deployed |
| 8 | Are spend paths capped by the escrow itself, and is the drain test recorded? | **no** | `setMyChargeLimit` exists on chain; the drain test (B4) needs funds |
| 9 | Did the last red-team round come back clean? | not applicable yet | First round is Phase 10 |
| 10 | Is any competitor name anywhere in tracked files? | **no, none** | `scripts/check-clean.ts` passes; positive and negative tests recorded in the Phase 1 report |
| 11 | Is any claim impossible for the deployed app to demonstrate? | none claimed yet | `LANE_MAP.md` and `JUDGE_TASTE.md` mark everything planned |
| 12 | Rubric self-score against the strongest sample | not meaningful yet | `reference/ABSORB.md` 18A table is all "open" |

Answers 2, 7 and 8 are "no" by construction at this stage. They gate polishing in later phases, not Phase 2.

## Probe wallets (testnet, throwaway)

| Role | Address | Funded |
|---|---|---|
| Probe house wallet (pays asks, funds the voyage key) | `0x2D62433a1C398CaE11Ae98Dbd5CCCE3645A95540` | no |
| Probe voyage key (index 0 of the probe mnemonic) | `0xfD29108e9Df6B3d89931d39Df3a9037f9dEe4937` | no |

Keys live only in `.env.local` (gitignored, mode 600) in the build container. They are test-only. If the container is
reclaimed they are lost with it, so fund only what the probe needs (about 0.02 Sepolia ETH).
