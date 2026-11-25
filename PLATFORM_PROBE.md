# PLATFORM_PROBE

Phase 1 probe of the Telegraph testnet node and Diamond, 2026-11-25 (UTC). Questions were registered before the run in
`FINDINGS.md` (hash in `evidence/probe/PREREG.sha256`). Raw responses are in `evidence/probe/`. Catalogue dumps that
name third-party miners are kept out of git and pinned by `evidence/probe/CATALOGUE_MANIFEST.sha256`.

## Status of the probe matrix (build instruction 4.4)

| Item | Status | Evidence |
|---|---|---|
| Unpaid challenge, decode the 402 (four intents) | done | `402_*.json`, `402_*.headers` |
| Published schema per intent, compatible miners, operator and mapping counts (eight intents) | done | catalogue (pinned), summary in `SPONSOR_INTEL.md` section 3 |
| One paid routed ask per intent, with miner, rank, cost, latency, signal, receipt | done, 28 rows (22 answers, 4 refused by the charge limit, 2 provider errors) | `paid/asks_matrix.json` |
| Fetch the signal and confirm the paying wallet is ours | done: 22 of 22 signals name our wallet; `created_at` inside the authorization window in all 22 | `paid/asks_matrix.json` |
| `depositUSDCFor` to a fresh address, ledger shows it | done: visible 1.2 s after confirmation, `available` immediately | `paid/stage_voyage.json` |
| Voyage key spends funds deposited by another wallet (kill rule 18D, second half) | **done, passes**: 4 asks served from a deposit made by a different wallet | `paid/stage_limit.json` |
| `setMyChargeLimit`: signature, readback, refusal text | done: limit applied by the node a few minutes after the transaction; refusal text recorded | `paid/stage_limit.json`, `paid/asks_matrix.json` |
| `requestWithdraw` lifecycle | request sent 2026-11-25 for 160000 uUSDC; waiting for status `ready` (outcome appended to `FINDINGS.md`) | `paid/stage_withdraw_request.json` |
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

## Paid probe results (2026-11-25, 06:38 to 06:43 UTC, 28 asks, 0.22 USDC spent)

Raw rows: `evidence/probe/paid/asks_matrix.json`. Position truth was fetched from Digitraffic AIS around each answer.
Vessel asked: a bulk carrier at berth in Kotka (MMSI 246546000).

**F15. Four operator wallets returned the correct, fresh position; they all return the same numbers.** Answers from the
wallets behind `vesselwire`, `zk-vessel-v2`, `txlens`, `a1-preflight` and `chainsight-oracle` matched the public AIS
position to the metre (0 m), at 95 to 161 seconds old. Four registrant wallets, one upstream.

**F16. Five answers were wrong or unusable, each in a different way, and one miner errored.**
- `ves-digit-loc`, `ves-digit-radius`: latitude equals longitude (27.17, 27.17), 3,710 km from the ship. Valid shape,
  `field_status` all `ok`.
- `ves-digit-ves`: returned a raw list of other vessels, not the one asked for.
- `ves-digitraffic`: latitude and longitude `null`, observed time as epoch milliseconds in a string.
- `quay-ais`: a position 79 km away, 25.3 hours old (`observed_at` 2026-11-24T05:21Z), speed 9.1 knots, all fields
  `ok`. This was the only non-Digitraffic source and it answered with a stale position for a ship that was moored.
- `ves-adsb-hel`: 503 `no_compatible_miner`.

**F17. Wrong place, on a routed ask.** `LIVE_PORT_CONGESTION_GENERAL` for "Kotka" and "HaminaKotka" returned port
`FIHKO` (Hanko, a different port) with 2 vessels waiting and `wait_hours` 17.4. Helsinki and Turku returned the right
codes. The rule WRONG_PLACE has a real occurrence, bought and receipted.

**F18. Operator disagreement is real, not hypothetical.** Of 10 served vessel answers, 8 carried a position: 5 agreed
within 1 m and 3 were wrong; 2 carried none. No two operators disagreed by a small amount; they disagreed by thousands
of kilometres, by 25 hours of age, or by returning nothing usable.

**F19. Time formats differ by miner.** `observed_at` came back as ISO, as `2026-11-25 06:38 UTC`, and as epoch
milliseconds in a string. The evidence reader must parse all three and refuse the rest.

**F20. Routing.** Routed asks served from rank 1 (`delivery: specialist`) for weather, FX and sanctions, and from rank 2
(`delivery: ranked_fallback`) for all four port asks and the document ask. Pinned asks carry no rank. Every routed
port ask went to the same miner. Latency 1.6 s to 15.7 s; median about 5 s.

**F21. Charge limit.** `setMyChargeLimit(10000)` was visible on chain at once; the node's ledger still showed
1,000,000,000 and four asks (40000 uUSDC in one block) were served. A few minutes later the ledger showed `charge_limit`
10000 and asks were refused: `charge limit reached for this block , it resets when the next block settles, or raise it
with setMyChargeLimit`. The cap holds, with a lag. The balance cap held at once.

**F22. Sanctions screening on a vessel name.** `name: "Iceland"` matched a person (`matched: true`, one list entry,
`lists` null, `match_score` null). Name screening of vessels returns false positives; it can be shown as a pre-watch
check but never as a decision.

**F23. Weather.** Kotka, 2026-11-24: 0.1 mm, "light drizzle", daily. Forecast with `window_hours` 1 returned "the next 24
hours", probability 0 percent. The intent ignores the 1 hour window.

## Kill and pivot rule (18D)

Rule text: stop if fewer than two independent operators return a usable, fresh position for vessels at HaminaKotka or
Helsinki, or if `depositUSDCFor` funds cannot be spent by the voyage key.

| Test | Result |
|---|---|
| `depositUSDCFor` funds spent by the voyage key | **Pass.** Four asks served from a deposit made by another wallet; escrow `available` fell 200000 to 160000 |
| At least two independent operators with a usable, fresh position | **Pass on the rule as written:** four operator wallets, 95 to 161 s old, 0 m error, for a ship in Kotka. **Fail on source independence:** every one of the four reads the same public AIS feed, and the only second source (shore receivers) returned a 25 hour old position. Helsinki was not tested by a pinned ask |

The rule is not triggered. The stronger reading, two independent sources, is not met for position. Consequences for
the design, reported to Kinnoski in the Phase 1 report: agreement between operators proves each relayed the same feed
correctly (it caught five faulty relays here), not that the feed is right; every receipt card shows the source family;
the statement says "one upstream" wherever that is true; and an hour is never moved by position alone when the second
source is stale.

## Still open

C3 withdraw timing (request in flight), D5 same-name places for weather (Kotka resolved correctly twice; Hanko-style
confusion appeared in the port intent instead), Helsinki pinned asks.
