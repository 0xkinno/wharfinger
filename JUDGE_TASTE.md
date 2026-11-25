# JUDGE_TASTE

The organiser's own words, each mapped to a screen or file, with an honest status. A status of "planned" means the
code does not exist yet. Words are quoted from the hackathon pages and the bounties repository as retrieved on
2026-11-25 (`RULES_EXTRACT.md`). The build instruction (section 18E) lists the first five as the organiser's taste;
the last row is the rules page's mission acceptance list.

| Organiser's words | Where Wharfinger answers | Status |
|---|---|---|
| "Proof, not a pitch: settled transactions a stranger can click through" | `/verify/[id]` recomputes a statement from `/engine/v1/signal/{hash}`; every evidence card links its signal and its ledger row | planned (Phase 4, 6) |
| "A real product, not a demo: it runs on the contracts that ship at mainnet" | Escrow Diamond rail only, no mock payment path; `MAINNET.md` lists what changes (address, USDC, key custody) | planned (Phase 6) |
| "Same contracts, same settlement path, same proof format, so nothing you build is rewritten later" | One escrow client (`packages/telegraph`) used by tick, judge door and probe; `SDK_SURFACE.md` | planned (Phase 4) |
| "You are not building another chatbot with a payment bolted on. Your app has a goal, needs several pieces of intelligence to reach it, and buys each one through Telegraph while it works" | The watch tick: vessel, port wait, conditions, recorded weather bought every 30 minutes toward one goal, a signed laytime statement | planned (Phase 4, 5) |
| "Telegraph routes each request to the highest-ranked miner. The app never picks or hardcodes a miner" | First buy is always `POST /engine/v1/ask` (routed). A pinned `POST /engine/v1/ask/{minerId}` is used only for a re-buy after a failed check, and is labelled as such | planned (Phase 4) |
| Mission acceptance: **Run it** with a new, realistic input | `/judge`: type any MMSI of a ship in a Finnish port call list; house key buys two answers | planned (Phase 7) |
| Mission acceptance: **Check it**, the useful result | Statement with the demurrage or despatch figure; owner recompute | planned (Phase 6) |
| Mission acceptance: **Inspect it**, the real Telegraph request and its accounting evidence | Receipt cards: miner, cost, latency, signal hash, receipt hash, epoch; `/trace` | planned (Phase 4, 7) |
| Mission acceptance: **Break it**, a reasonable failure case | Fault switch and `/judge` failure buttons B2 to B7 | planned (Phase 8) |
| Mission acceptance: **Reproduce it** from the instructions | `pnpm verify` offline from a clean clone; `JUDGE.md`; `TUTORIAL.md` | planned (Phase 6, 10) |

## Scoring against the words (current)

Nothing is built yet, so the score is the design's, not the product's. The one place the design already conflicts
with a word is routing: the vessel intent has no ranking to route by (see `PLATFORM_PROBE.md`, finding F3). The
routed ask still works, but "highest-ranked miner" carries no signal for that intent until an evaluation pool
reaches its minimum of 3 submitters. This is reported to Kinnoski in the Phase 1 report.
