# FRICTION_REPORT

Telegraph platform flaws and rough edges found while building. Neutral tone, measured, dated. Nothing here appears in
the README headline, the hero or the first 60 seconds of the video. With Kinnoski's approval each item is also filed
as an issue on the bounties repository; none has been filed yet.

| # | Date | What was observed | Evidence | Effect on us | Suggested fix |
|---|---|---|---|---|---|
| 1 | 2026-11-25 | The engine's CORS preflight allows only `Content-Type` and `POST`. A browser cannot send `X-PAYMENT`, and the 402 response exposes no custom headers | `evidence/probe/cors_preflight_ask.txt` | Paid asks must be server-side. A browser-only agent cannot use the escrow rail | Allow `X-PAYMENT` in `access-control-allow-headers` and expose `X-PAYMENT-RESPONSE` |
| 2 | 2026-11-25 | The vessel, weather-verify and document intents have no leaderboard entry. 15 ranked vessel miners all score 0. The evaluation pools hold 2 and 1 submitters against a minimum of 3 | `PLATFORM_PROBE.md` F3 | "Routed to the highest-ranked miner" has no ranking behind it for the vessel intent | Surface "unranked" in the ask reply (`served_rank` with a score) |
| 3 | 2026-11-25 | Many miners on one intent share a registrant wallet and an upstream source (11 vessel miners from one wallet, 8 of them reading one public AIS service, 3 reading an aircraft tracker) | `PLATFORM_PROBE.md` F4 | Corroboration across miners can be a single source repeated | Publish a declared `source` per miner and let callers filter by it |
| 4 | 2026-11-25 | `SHIP_RATE_ETA_GENERAL` is a parcel rate (origin, destination, weight) but is listed under the Commodities mission as a core starting intent | `catalogue` schema; bounties `docs/MISSIONS.md` section 08 | A commodities builder reading the mission list expects a vessel ETA | Rename or add a vessel ETA intent |
| 5 | 2026-11-25 | Docs say the testnet epoch is one hour; the one block read has a 4.5 hour window | `evidence/probe/block_52.json` | Receipt proof arrives hours later than the docs imply | Update the docs or the epoch |
| 6 | 2026-11-25 | Docs give the adapter bond as 5,000,000 and the evaluation minimum as 5 contributors; the chain returns 100,000 and the status endpoint returns 3 | `evidence/probe/chain_state.json`, evalpool status | Planning numbers differ from the live ones | Align docs with the node |
| 7 | 2026-11-25 | The signal record has the paying wallet and `created_at` but not the receipt hash or epoch | `evidence/probe/signal_sample.json` | A counterparty cannot link a signal to a billed receipt without our stored header | Include `receipt_hash` and `epoch_id` in the signal record |
| 8 | 2026-11-25 | Weather verification is daily only | `PLATFORM_PROBE.md` F6 | Hourly rain claims cannot be bought | Add an hourly observation intent |
