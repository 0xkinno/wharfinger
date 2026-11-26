# PROGRESS

Self-judging after each phase (build instruction section 18). A "no" stops polishing. Scored honestly. The first table is the
state at the end of the statement core; the update below supersedes it.

## After Phase 4 and the statement core (2026-11-25, 107 tests)

| # | Question | Answer | Basis |
|---|---|---|---|
| 1 | Non-technical person repeats the problem in 10 seconds of the landing page | not applicable yet | No UI |
| 2 | Real Telegraph purchase, autonomous, unattended, moves a priced hour | **partly** | Live tick bought 4 answers with receipts and corroborated a berth zone. Not unattended and not yet driving an hour in a deployed app |
| 3 | Mira does something software cannot (SOF, resolve REVIEW, sign) | yes in the engine and statement | The sample resolves one REVIEW interval and carries both signatures; no screen yet |
| 4 | Owner recomputes without trusting us, online and offline | offline yes | `pnpm verify` passes the sample and fails 8 tamper cases. Browser recompute not built |
| 5 | Sponsor features named only where called, with file:line | yes | `SDK_SURFACE.md`, drift test |
| 6 | Every headline number from FACTS or a live endpoint, misses named | partly | No FACTS.json yet. Every number in the docs traces to `evidence/` |
| 7 | Judge sees a corroborated fact with receipts in 60 seconds, no login, on a phone | **no** | Nothing deployed |
| 8 | Spend capped by the escrow itself; drain test recorded | partly | Escrow balance and charge limit refusals recorded live; the 0.05 USDC drain run (B4) is only a fake-node test |
| 9 | Last red-team round clean | not applicable yet | |
| 10 | Competitor name in tracked files | **no, none** | `check:clean` in CI |
| 11 | Claim the deployed app cannot demonstrate | none claimed | No app is claimed |
| 12 | Rubric score | not meaningful yet | Growth, adoption and UI are the large gaps |

Answers 2, 4 (browser), 7 and 8 (live drain) gate Phase 7 polishing.

## Update 2026-11-26 (117 tests)

| # | Question | Answer | Basis |
|---|---|---|---|
| 2 | Real purchase, autonomous, unattended | **running** | Production voyage `kraftca-fiktk-1000004` is funded and ticks every 30 minutes through the scheduler; it is complete only when the ship sails |
| 4 | Owner recomputes, online and offline | **yes** | Browser recompute on `/verify/*` and `/judge`; tamper fails at the changed line; wallet suite ALL PASSED |
| 7 | Judge path in 60 seconds, no login, on a phone | **yes** | Deployed; six viewport suite ALL PASSED on production |
| 8 | Spend capped by the escrow; drain recorded | **yes** | `/api/judge/fault?mode=drain` recorded live run |
| 11 | Claim the deployed app cannot demonstrate | none | Solana is devnet with a test token; Pay.sh is not claimed |

New since the first table: settlement gate and `/settle`, two real screening receipts, one released payment on Solana devnet
read back from the chain, production secrets and database, house escrow funded, issue 196 read.

Still open: finish of the unattended voyage, six week replay, red team rounds, evaluator and miner entries, chart-derived port
limits, Pay.sh rail, video, posts.

## Honest gaps found by building

- Position corroboration is across operators that share one upstream feed (`ONE_UPSTREAM`), and the one other source was stale.
- The Kotka port queue cannot be bought correctly; zone geometry is a draft.
- Hourly weather is not purchasable; the weather exception is daily plus an SOF line.
- Epoch proof of receipts arrives hours later.

## Probe wallets (testnet, throwaway)

| Role | Address | Funded |
|---|---|---|
| Probe house wallet (pays asks, funds the voyage key) | `0x2D62433a1C398CaE11Ae98Dbd5CCCE3645A95540` | no |
| Probe voyage key (index 0 of the probe mnemonic) | `0xfD29108e9Df6B3d89931d39Df3a9037f9dEe4937` | no |

Keys live only in `.env.local` (gitignored, mode 600) in the build container. They are test-only. If the container is
reclaimed they are lost with it, so fund only what the probe needs (about 0.02 Sepolia ETH).
