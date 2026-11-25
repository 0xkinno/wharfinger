# task.md

Mirror of the phases in the build instruction. `[x]` only when verified by a test, a live run or a file that exists.
Last updated 2026-11-25 (UTC). 108 tests pass; CI runs `check:clean`, `check:copy`, `typecheck`; the browser suite `e2e/smoke.mjs` passes on 6 viewports x 10 pages.
Live app: https://wharfinger-kinnoskis-projects.vercel.app (Vercel project `wharfinger`, public, no login).

## Phase 0. Setup and law
- [x] Repo, `.gitignore`, authorship setup (all commits `0xkinno`, none with AI attribution), CI, house-style and clean checks (tested positive and negative)
- [x] 12 reference repos cloned, `BANNED_NAMES.txt`, `ABSORB.md`, `RULES_EXTRACT.md`, `LANE_MAP.md`, `JUDGE_TASTE.md`, `GROWTH.md`
- [x] Anjoman missions and rules pages read; they match the earlier extract
- [ ] Mission 08 issue body (bounties issue 196): GitHub API access to that repository is not granted to the agent. Paste it into `reference/issue-196.md`
- [ ] H2 gallery check for a Mission 08 app: the page is browser-rendered; check by hand before submission

## Phase 1. Sponsor and probe: complete
- [x] Docs, pre-registered `FINDINGS.md`, paid matrix (28 asks), `PLATFORM_PROBE.md` F1 to F25, kill rule applied (not triggered; independent-source reading not met)
- [x] `requestWithdraw` requested; node status `waiting_root`. `executeWithdraw` scripted (`--stage=withdraw-exec`), pending the node's ledger root

## Phase 2. Person and thesis: complete
- [x] `MOMENT.md` (every figure asserted by tests; Reed Smith read through its Mondaq copy; BIMCO unreadable and not relied on), `DISCOVERY.md`, `THESIS.md` (weather decision, Kinnoski approved), `RISK.md`, `MISSION_FIT.md`
- [x] App deployed at a final Vercel URL with `/api/status`
- [ ] Practitioner replies: none received. Name collision check (npm, GitHub, domain): not run

## Phase 3. Truth and the laytime engine: complete; geometry is a draft
- [x] `packages/laytime` (engine 1.1.0, property tests 10,000 runs, versioned verification), `packages/truth`
- [ ] Port limits from a chart source: Digitraffic publishes no polygons; shipped boxes are labelled draft

## Phase 4. Buying and corroborating: complete
- [x] `packages/telegraph`, `packages/evidence` (replayed on real answers), live ticks recorded in the database and `evidence/live`

## Phase 5. Durable watcher and voyage keys: complete except the unattended run
- [x] Neon schema applied (append-only triggers), Postgres store, leases, counters, voyage key derivation, funding verified from the ledger, `setMyChargeLimit`, headless funding, one voyage created, funded and ticked end to end
- [x] GitHub Actions workflow `watch.yml` (30 minutes); it skips until `WHARFINGER_URL` and `WATCH_TICK_SECRET` are set
- [x] B4 budget drain run live: 5 paid answers, then the node's own refusal; watcher held
- [ ] One full unattended voyage from NOR to sail: needs the scheduler secrets on the deployment and a ship's stay

## Phase 6. Statement and counterparty
- [x] Canonical JSON, EIP-712 for both parties, `pnpm verify`, browser verify page with live signal comparison, owner countersign and line disputes, PDF, XLSX, JSON, `RUNBOOK.md`, `MAINNET.md`, `SECURITY.md`
- [ ] Email alerts at NOR, laytime start, demurrage start, sailing; terms hash shown at funding (hash is computed and stored, shown on creation only)

## Phase 7. UI
- [x] `DESIGN.md`, landing, harbour, voyage, statement, verify, evidence, judge, trace, navbar with wallet and power icon, guided tour, designed states
- [x] Browser suite: console clean, no horizontal scroll, no art/text overlap, axe WCAG 2 A and AA clean, screenshots in `e2e/screens`
- [ ] Wallet flows with a mocked provider on an Anvil fork; the two logged design passes; audio for the tour; Satoshi font (substituted, see `DESIGN.md`)

## Phase 8. Proof
- [x] `/api/stats` computed from stored purchases; B1 to B7 covered by tests, the judge buttons and the recorded drain run
- [ ] P1 wild set (a long unattended run), P2 six-week replay with counterfactual, P3 hand-labelled subset, `scripts/facts.ts` and `docs/FACTS.json` with a CI check

## Phase 9. Tracks 2 and 3: not started
Evaluator pairs and miner endpoint and registration. The evaluation pools for the two intents have 2 and 1 submitters against a minimum of 3. Uploading and registering are outward actions that need Kinnoski's approval.

## Phase 10. Judge path and docs
- [x] `JUDGE.md`, `README.md` with real screenshots, `SDK_SURFACE.md` with a drift test, `DEPLOY.md`
- [ ] Red-team rounds on the deployed URL (`REDTEAM_LOG.md`)

## Phases 11 and 12: not started
Growth posts, outside reproduction of the tutorial, video, submission. Each needs Kinnoski's approval; drafts are in `GROWTH.md`.

## Needs Kinnoski (the only things that unlock the rest)
1. Vercel env secrets (`DEPLOY.md`): `DATABASE_URL` (claim https://neon.new/claim/01a212bc-0c3b-74c5-91e5-56fc83eb7d33 before 2026-11-28, or add Neon in Vercel), `WATCH_TICK_SECRET`, `WATCH_MASTER_MNEMONIC`, `HOUSE_PRIVATE_KEY`; GitHub secret `WATCH_TICK_SECRET` and variable `WHARFINGER_URL`.
2. Paste issue 196; check the H2 gallery.
3. Approve the first post, the scope comment on issue 196, `/claim`, and the evaluator upload and miner registration.
