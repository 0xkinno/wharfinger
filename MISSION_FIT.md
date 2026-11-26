# MISSION_FIT

Mission 08, Commodities. The official mission page (retrieved 2026-11-25) states the problem as: vendors bill by
subscription, so no trading house can measure what its intelligence earns, and cargo provenance is assembled by hand.
It lists three example builds. The build instruction maps Wharfinger to them as follows. Each route is a candidate to
complete separately; a route that is not built says so.

| Mission 08 route (as worded by the organiser) | Wharfinger | Status |
|---|---|---|
| Intelligence ROI: "P&L per unit of intelligence purchased" | `$ of demurrage decided per $ of intelligence` per voyage and overall, from FACTS. This is demurrage dollars settled by receipts, not paper trading P&L, and is labelled so | planned (Phase 8) |
| Cargo and counterparty provenance: "a receipt on every check" | Pre-watch screen of vessel name and registered owner with `SANCTIONS_SCREENING_MATCH_GENERAL`. Probe F22: a vessel name returned a false person match, so this is shown as a screening note, never a decision | planned (Phase 6) |
| Scarce-answer price discovery: "agents bid for one scarce answer" | Not built. Stated in the README limitations | not built |

Intents the official page lists for Intelligence ROI: `LIVE_PORT_CONGESTION`, `VESSEL_TELEMETRY_VERIFY`,
`WEATHER_FORECAST_VERIFY`, `SHIP_RATE_ETA`, `WEB_SEARCH`. Wharfinger buys the first three. It does not buy
`SHIP_RATE_ETA` (a parcel rate, F5) or `WEB_SEARCH` (no intent of that name is served, per the bounties repository).

## Mission 08 issue body, read 2026-11-26

The issue (bounties 196) names three example routes: intelligence ROI on paper positions, cargo and counterparty provenance, and
scarce-answer price discovery. Wharfinger sits closest to route 2: vessel history from `VESSEL_TELEMETRY_VERIFY`, sanctions checks
from `SANCTIONS_SCREENING_MATCH`, a recomputable statement as the trade file, and a settlement gate (`/settle`) that holds or
releases a payment on that evidence. The issue asks for one failure case (stale AIS reading, ambiguous vessel, inconsistent port
data), a cost per useful outcome, and never to claim a paper trade as real profit. Wharfinger records its failures on `/evidence`,
shows cost per answer and per stay, and makes no profit claim. Not covered: `CORPORATE_REGISTRY_LOOKUP` and `DOCUMENT_AUTHENTICITY`.
