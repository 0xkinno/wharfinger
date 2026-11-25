# PLATFORM_PROBE

Phase 1 probe of the Telegraph testnet node and Diamond, 2026-11-25 (UTC). Questions were registered before the run in
`FINDINGS.md` (hash in `evidence/probe/PREREG.sha256`). Raw responses are in `evidence/probe/`. Catalogue dumps that
name third-party miners are kept out of git and pinned by `evidence/probe/CATALOGUE_MANIFEST.sha256`.

## Status of the probe matrix (build instruction 4.4)

| Item | Status | Evidence |
|---|---|---|
| Unpaid challenge, decode the 402 (four intents) | done | `402_*.json`, `402_*.headers` |
| Published schema per intent, compatible miners, operator and mapping counts (eight intents) | done | catalogue (pinned), summary in `SPONSOR_INTEL.md` section 3 |
| One paid routed ask per intent, with miner, rank, cost, latency, signal, receipt | **blocked: wallet not funded** | script ready: `scripts/probe-paid.ts --stage=asks` |
| Fetch the signal and confirm the paying wallet is ours | **blocked** (needs a paid ask). Signal schema and offline hash check done on a real third-party signal | `signal_sample.json`, `scripts/verify-signal.ts` |
| `depositUSDCFor` to a fresh address, ledger shows it | **blocked: no gas, no USDC** | `--stage=voyage` |
| Voyage key spends funds deposited by another wallet (kill rule 18D, second half) | **blocked** | `--stage=voyage`, `--stage=limit`, `--stage=asks` |
| `setMyChargeLimit`: signature, readback, refusal text | signature and default confirmed on chain; refusal text blocked | `chain_state.json`, `diamond_selectors_matched.json`; `--stage=limit` |
| `requestWithdraw` lifecycle | **blocked** | `--stage=withdraw-request`, `--stage=withdraw-exec` |
| CORS for browser `fetch` with `X-PAYMENT` | done | `cors_preflight_ask.txt`, `cors_402_origin.txt` |
| Authorization refusals (window, amount, recipient, replay, chain, expiry) | done, 13 cases | `c5_auth_refusals.json` |
| Diamond facets, selectors, state | done | `diamond_facets.json`, `diamond_selectors*.json`, `chain_state.json` |
| Public truth for real vessels (Digitraffic port calls and AIS) | done | `dt_*.json` |
| Evaluation pool status for the two scored intents | done | `reference` copy; numbers below |

## Findings

Neutral tone. Items that are Telegraph platform flaws are repeated in `FRICTION_REPORT.md` and appear nowhere in the
README headline.

**F1. Authorization rules match the docs.** All 13 cases returned the documented reason (window over 2 minutes, wrong
amount, wrong recipient, replayed nonce, checksummed `from`, expired, not yet valid, wrong chain). Only the case with a
valid signature and no funds reached the balance check, and it spent the nonce. No contradiction found.

**F2. CORS blocks `X-PAYMENT` from a browser.** The preflight for `POST /engine/v1/ask` answers 204 with
`access-control-allow-headers: Content-Type` and `access-control-allow-methods: POST` when the requested headers are
`content-type` alone, and answers 204 with no allow headers at all when `x-payment` is requested. Real responses carry
`access-control-allow-origin: *`. `GET` routes (signal, ledger, miners, blocks) allow any origin. Consequence: paid asks
are made server-side with the voyage key, as the design already assumes; the verify page can read evidence directly.

**F3. The vessel intent has no ranking to route by.** The leaderboard for epoch 53 has no entry for
`VESSEL_TELEMETRY_VERIFY_GENERAL`, `WEATHER_FORECAST_VERIFY_GENERAL` or `DOCUMENT_AUTHENTICITY_GENERAL`. Fifteen of the 19
vessel miners carry a rank (4 to 19, with gaps) and every score is 0. Evaluation pools: vessel intent 61 rows from 2
submitters, port intent 60 rows from 1 submitter, `min_submitters` 3 on both. The port intent does have a ranked
leader (score 0.9773). The rules say the app never picks a miner; for the vessel intent the node's pick rests on an
unscored set.

**F4. Operator count overstates source independence.** The 19 vessel miners belong to 6 registrant wallets. One wallet
runs 11 (eight read Digitraffic and three read adsb.lol, an aircraft tracking service), one runs 4 (all four served from one hosted
worker; the two descriptions read name Digitraffic, and one of them says single-source AIS is not independent
verification), and four wallets run one each (one reads shore-based AIS receivers worldwide, registered 2026-11-23, so
still inside the 7-day grace period; one describes AIS coverage around Finland and the Baltic without naming a source;
two list the intent among many). Two operator groups therefore share one upstream source. One
miner (`ves-digitraffic`) declares a default pinned MMSI and says its proxy falls back to other live Finnish vessels
when the pin has no recent AIS: a possible wrong-vessel answer to test as D3. Design change proposed: corroboration
needs two operators **and** two source families, with the source family recorded per miner and shown on every receipt
card.

**F5. `SHIP_RATE_ETA_GENERAL` is a parcel rate.** Params are `origin`, `destination`, `weight_kg`; fields are `carrier`,
`rate`, `currency`, `transit_days`, `eta`. The build instruction listed it as an optional ETA check for a laycan
window. It cannot do that. Dropped.

**F6. Weather verification is daily; hourly rain cannot be bought.** `WEATHER_FORECAST_VERIFY_GENERAL` takes a past
`date` and returns daily `temp_max_c`, `temp_min_c`, `precipitation_mm`, `condition`. `WEATHER_FORECAST_GENERAL` takes
`window_hours` and returns `precipitation_probability_pct`, a forecast. Neither gives "it rained between 14:00 and
18:00". Section 6.5's rule ("weather exception only for hours with a corroborated precipitation fact") needs a
decision from Kinnoski before Phase 2 writes `THESIS.md`. Options are listed in the Phase 1 report.

**F7. Port-call data has gaps.** On 2026-11-25 Digitraffic listed 15 distinct vessels in port at Kotka, Helsinki and
Turku (ata set, atd absent). Five of them carry `mmsi: 0`. Of nine MMSIs queried for an AIS position, three returned
no feature. A voyage must be able to start from IMO or name, and a vessel with no AIS must be shown as "not seen",
never guessed. `evidence/probe/dt_portcalls_*.json`, `dt_ais_*.json`.

**F8. Epoch blocks close hours after a purchase, and the epoch is longer than the docs say.** Block 52 covers
2026-11-24T23:43:07Z to 2026-11-25T04:13:39Z (4.5 hours) and lists 342 deliveries, all class `paid_consumer`, none for
a vessel or port intent. Epoch 53 was still running at 06:20Z and answered 404 `no block recorded for this epoch`.
The docs say the testnet epoch is one hour. A receipt is provable against
`/v1/blocks/{epoch}/deliveries/{receiptHash}` only after its epoch closes and the block is recorded, which here means
hours, so the statement needs a "block pending" state and must keep the receipt header itself.

**F9. Signal recompute works.** `scripts/verify-signal.ts` recomputed the keccak256 of a real signal payload and
matched the published hash. The signal carries the paying wallet and `created_at` but not the receipt hash or epoch,
which exist only in the response header.

**F10. Escrow function and default limit.** `setMyChargeLimit(uint256)` is on the escrow facet (`0xf3f44d54`),
`chargeLimitOf` returns 1,000,000,000 uUSDC (1,000 USDC per block) by default, and `executeWithdraw` has selector
`0x6c438297`. 125 selectors on other facets are unresolved by name (the list includes `executeWithdraw`, identified from the proof calldata); none is needed.

**F11. Small doc and chain disagreements.** `entityBonds()` returns adapter bond 100000 and contributor bond 1000000
(docs show 5000000 and 1000000). The evaluation pool docs say at least 5 contributors; the status endpoint says
`min_submitters` 3. Testnet epoch 1 hour (docs) versus one observed 4.5 hour epoch window.

**F12. Asks are public.** The Daemon feed lists direct user asks with their question text and the signal page names
the paying wallet. Vessel MMSIs and names Wharfinger buys will be public. They are public record already; the persona
is labelled fictional.

**F13. Real demand on the vessel and port intents is nil.** Block 52 holds no vessel or port delivery. Wharfinger would
be the main buyer. Positive for lane uniqueness; it also means miners on these intents are barely exercised.

**F14. Digitraffic access rules.** The API answers 406 unless the request sends `Accept-Encoding: gzip` and, by their
policy, a `Digitraffic-User` header. HaminaKotka is two locodes: `FIKTK` (Kotka, in use) and `FIHMN` (Hamina, no
current calls). The Telegraph port intent takes a free name, so how "HaminaKotka" is read is a probe item.

## Evaluation pool snapshot (for Track 2)

| Intent | Rows | Submitters | Minimum | Active from epoch |
|---|---|---|---|---|
| `VESSEL_TELEMETRY_VERIFY_GENERAL` | 61 | 2 | 3 | 47 |
| `LIVE_PORT_CONGESTION_GENERAL` | 60 | 1 | 3 | 47 |

## Not yet measured

D1 (position disagreement between operators), D2 (staleness of `observed_at`), D3 (wrong vessel), D4 (port wait
agreement), D5 (same-name places), C1 (deposit visibility timing), C2 (limit refusal text), C3 (withdraw timing).
All need the funded probe. Each will be appended to `FINDINGS.md` under RESULTS with the raw file name.
