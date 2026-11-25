# LANE_MAP

Which Season II missions already have visible app entrants, described by mission only. No project names.
Evidence for each row is in `reference/` (gitignored). Checked 2026-11-25.

| Mission | Visible app entrants | Basis |
|---|---|---|
| 01 Exchange, 13 Asset Management, 14 Web3 and DeFi | Several (token listing and preflight desks) | Public repositories of Season II entries, read in full |
| 15 Consumer Automation | Several (service credit and disruption claim finders) | Public repositories read in full |
| 11 Autonomous Systems, 06 Resources and Agriculture | One (a simulated machine fleet buying weather and price answers) | Public repository read in full |
| 10 Model Economy | One (a security-review evaluator with a dependency checker) | Public repository read in full |
| **08 Commodities** | **None found** | No repository read touches vessel, port, laytime, demurrage or commodities as a product; the string matches found are intent lists inside probe files |

## What this map cannot show

- It covers 11 public repositories gathered before the build. An entry that is private, not yet pushed, or not
  linked from the hackathon pages is invisible to it.
- The Mission 08 issue body (bounties issue 196) and the H2 gallery at `anjoman.ai/dashboard/apps` could not be read
  from the build environment: the issue needs GitHub API access, and the gallery is rendered in the browser from data
  the build agent could not reach. **Kinnoski to open both and report any app listed under Mission 08.**
- Miners and evaluators are separate lanes. Mission 08 has miners for sanctions screening and weather verification and
  one evaluator for FX and macro indicators, per the build instruction. This session re-checked the live network:
  `VESSEL_TELEMETRY_VERIFY_GENERAL` has 19 compatible miners and an evaluation pool with 2 submitters;
  `LIVE_PORT_CONGESTION_GENERAL` has 15 miners and a pool with 1 submitter. The pool minimum is 3.

## Re-check schedule

Before Phase 12 (submission), repeat both checks. If an app appears under Mission 08, the judge door leads with what
only Wharfinger proves: receipts bought during the port stay, two-operator corroboration, and a signature from each
party.
