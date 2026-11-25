# task.md

Mirror of the phases in the build instruction. `[x]` only when verified. Last updated 2026-11-25 (UTC).

## Phase 0. Setup and law

- [x] Repo initialised; `.gitignore` (reference/, .env*, evaluator/private/, scorer/champions/, probe catalogue dumps)
- [x] Authorship setup (section 14): local identity, commit-msg hook (tested), `.claude/settings.json`, server-side workflow (YAML parsed)
- [ ] Local git email: needs Kinnoski's GitHub noreply address. Commits are not made until it is set.
- [x] CI skeleton (`ci.yml`), `scripts/check-clean.ts` (hashed names, tested positive and negative), `scripts/check-copy.ts` (tested)
- [x] `.env.example`, `.env.local` (empty, gitignored), `LICENSE` (MIT)
- [x] Reference repos cloned (12 of 12) into `reference/`
- [x] `reference/BANNED_NAMES.txt`, `reference/ABSORB.md` (every file it cites was opened and exists)
- [x] `RULES_EXTRACT.md` verbatim from live rules, missions and timeline pages and the bounties repository
- [ ] Mission 08 issue (bounties issue 196) body: blocked, no API access. Kinnoski to paste it into `reference/issue-196.md`
- [x] `LANE_MAP.md` by mission only (two re-checks left open, see file)
- [x] `JUDGE_TASTE.md`
- [x] `GROWTH.md` started; first public post and `/claim` on issue 196 drafted for approval

## Phase 1. Sponsor and probe

- [x] Read the docs in 4.1 (saved in `reference/docs/telegraph/`). Twelve in full, two by relevant section, twelve by headings and opening section (six of them also by constraint lines); `SPONSOR_INTEL.md` section 4 lists each. Full read of the last group is the first task of Phase 9. The Anjoman dashboards are browser-rendered and unread
- [x] Pre-register `FINDINGS.md` questions; sha256 recorded in `evidence/probe/PREREG.sha256` (a git commit of the hash waits for the local email)
- [ ] Run the probe matrix: unpaid challenges, miners, signals done; paid asks blocked on a funded house wallet
- [ ] Probe `depositUSDCFor`, `setMyChargeLimit`, withdraw lifecycle: blocked on funded wallet and gas. CORS done. Facet functions identified.
- [x] Read the Diamond (18 facets, 274 selectors, 5 resolved by hashing candidates plus 1 from proof calldata, state, charge limit default); `PLATFORM_PROBE.md`
- [ ] Apply the kill and pivot rule (18D): partial evidence reported; decisive paid probe blocked on funding
- [ ] Kinnoski funds the house wallet; first paid routed ask per intent; signal shows our wallet

## Phases 2 to 12

Not started. Phase 2 begins only after Kinnoski reads the Phase 1 report.
