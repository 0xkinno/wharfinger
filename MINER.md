# Wharfinger Port Queue (Telegraph miner)

A keyless provider for `LIVE_PORT_CONGESTION_GENERAL`, built because routed asks for Kotka were answered for Hanko (`FIHKO`) every
time (`PLATFORM_PROBE.md`, F24). It runs inside the same deployment as the app.

| | |
|---|---|
| Miner id and slug | `7310101`, `wharfinger-port-queue` |
| Intent | `LIVE_PORT_CONGESTION_GENERAL` (judgment class, 15 miners serve it) |
| Endpoint | `GET https://wharfinger-kinnoskis-projects.vercel.app/api/miner/port-congestion?port=<name or LOCODE>` |
| Descriptor | `apps/web/public/miner/wharfinger-port-queue.yaml`, served at `/miner/wharfinger-port-queue.yaml` |
| Descriptor SHA-256 | `0xbf5aeddae01947595317c797ba5b56e0d44e1325ad45a7d36b1b8fafecf382c3` |
| Auth | none |
| Ports | Kotka-Hamina `FIKTK`, Helsinki `FIHEL`, Turku `FITKU`; anything else is `404 port_not_covered` |

## What it answers
`port`, `vessels_waiting`, `wait_hours`, `congestion_level`, `as_of` (the intent's response fields) plus `vessels_at_berth`, `method` and
`sources`. A ship counts as waiting when its AIS status is "at anchor" within the port's anchorage radius. Its wait is the time since
the planned arrival on a port call with no recorded arrival. When nothing is waiting it says 0, and `wait_known_for` says how many
waiting ships had a matching port call. Data: Fintraffic Digitraffic AIS and port calls, CC BY 4.0.

## Limits, stated
The anchorage radius and port centres are a labelled draft, not chart anchorage limits. Other miners for this intent also read
Digitraffic, so this is a competing implementation on the same public source, not an independent one. Thresholds for the congestion
level are in `packages/truth/src/portqueue.ts` and tested in `tests/portqueue.test.ts`.

## Registering (Anjoman, Miners page)
1. YAML URL: the descriptor URL above. 2. YAML hash: the SHA-256 above (it must equal `sha256sum` of the served file). 3. Untick
"Requires API key". 4. Validate endpoints. 5. Register miner (adds to your USDC bond, about $1 for the first intent; the Faucet covers it).
Registration is on-chain and cannot be edited, so change the YAML only by registering an update and recomputing the hash.
