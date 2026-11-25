# task.md

Mirror of the phases in the build instruction. `[x]` only when verified by a test, a live run or a file that exists.
Last updated 2026-11-25 (UTC). 107 tests pass; CI runs `check:clean`, `check:copy`, `typecheck` on every push.

## Phase 0. Setup and law: complete except two items that need Kinnoski
- [x] Repo, `.gitignore`, authorship setup, CI skeleton, house-style and clean checks (tested positive and negative)
- [x] Reference repos cloned (12), `BANNED_NAMES.txt`, `ABSORB.md`; `RULES_EXTRACT.md`; `LANE_MAP.md`; `JUDGE_TASTE.md`; `GROWTH.md` with drafts
- [x] Official Anjoman missions and rules pages read; mission 08 text matches the earlier extract (Intelligence ROI is the headline route)
- [ ] Mission 08 issue body (bounties issue 196): no API access. Kinnoski to paste into `reference/issue-196.md`
- [ ] H2 gallery check for a Mission 08 app: browser-rendered, unreadable by the agent. Kinnoski to check before submission

## Phase 1. Sponsor and probe: complete, one measurement pending the network
- [x] Docs read (depth listed in `SPONSOR_INTEL.md` section 4); `FINDINGS.md` pre-registered then answered; `PLATFORM_PROBE.md` F1 to F25
- [x] Paid matrix: 28 asks, 22 answers; signals name our wallet; clock bracket holds in 22 of 22
- [x] `depositUSDCFor` visible in 1.2 s and spent by the voyage key; `setMyChargeLimit` applied minutes later with refusal text recorded
- [x] Kill rule (18D) applied: not triggered; the stronger reading (independent sources) is not met for position
- [ ] `requestWithdraw` lifecycle: request sent, node says `waiting_root`; `executeWithdraw` after status `ready`

## Phase 2. Person and thesis: complete
- [x] `MOMENT.md` (figures asserted by `tests/sources.test.ts`; two sources unreadable and listed as unverified), `DISCOVERY.md` with a script, `THESIS.md`, `RISK.md`, `MISSION_FIT.md`, `reference/BEAT.md`
- [ ] Practitioner replies for `MOMENT.md`: none received
- [ ] Empty Next.js app at the final Vercel URL with `/api/status`: needs the Vercel project (see "Needs Kinnoski")
- [ ] Name collision check at G4 (npm, GitHub, domain): not run

## Phase 3. Truth and the laytime engine: complete for the engine; geometry is a draft
- [x] `packages/laytime`: every rule unit-tested; 5 property tests at 10,000 runs; found and fixed 3 engine flaws
- [x] `packages/truth`: Digitraffic and Open-Meteo readers, sha256 archive, tested on saved real data
- [ ] Port geometry from published limits: Digitraffic publishes none; shipped boxes are derived from AIS and labelled draft. Needs a chart source
- [ ] FMI observation reader (Open-Meteo is the replay source so far)

## Phase 4. Buying and corroborating: complete
- [x] `packages/telegraph` escrow client (fake node tests; found and fixed a 125 s window bug), signal recompute
- [x] `packages/evidence`: freshness, place, vessel identity, clock bracket, operator and source-family grouping, corroboration, refusal codes, ranked re-buy; replayed on the real Phase 1 answers
- [x] Live tick against the real node recorded in `evidence/live/purchases.ndjson`

## Phase 5. Durable watcher and voyage keys: partial
- [x] `packages/watch`: leases, budget gate, drain behaviour (B4 on a fake node), append-only rows
- [x] `packages/db/schema.sql` written (append-only triggers); not applied
- [ ] Neon database, funding verification from the ledger, voyage key derivation in the app, GitHub Actions 30 minute tick, one unattended voyage: needs `DATABASE_URL`, Vercel project, tick secret

## Phase 6. Statement and counterparty: core complete, app surfaces not built
- [x] Canonical JSON, EIP-712 for analyst and owner, `pnpm verify` offline, sample from real answers; tamper tests (B7)
- [ ] PDF, XLSX, `/statement`, `/verify` pages, email alerts, terms hashing at funding, `pnpm verify` from a clean clone in CI
- [x] `RUNBOOK.md`, `MAINNET.md`, `SECURITY.md`, `DISCLOSURES.md`

## Phases 7 to 12: not started
UI and Playwright (7), wild set, six-week replay and hand labels, `facts.ts` (8), evaluator and miner entries (9), `JUDGE.md`,
red team, README (10), growth posts and tutorial reproduction by an outsider (11), video and submission (12).
The tutorial (`TUTORIAL.md`) exists and was run live. Every outward action waits for Kinnoski's approval.

## Needs Kinnoski
1. Vercel project linked to this repo; Neon database (`DATABASE_URL`); Reown project id; `WATCH_TICK_SECRET`; `WATCH_MASTER_MNEMONIC`; a real `HOUSE_PRIVATE_KEY`.
2. Paste issue 196; check the H2 gallery; read the two unreadable sources (Reed Smith, BIMCO).
3. Approve the first post, the scope comment on issue 196 and `/claim` (drafts in `GROWTH.md`).
4. A chart source for port limits, or approval to ship the draft boxes.
