# DISCOVERY

## What the network sells: now, and only now

Run `pnpm exec tsx scripts/discovery.ts` (no keys, no spend). Output from 2026-11-25 is in
`evidence/probe/discovery_output.txt`:

| Intent | Params | Can any param carry a time? |
|---|---|---|
| `VESSEL_TELEMETRY_VERIFY_GENERAL` | `vessel` | No. It answers for the present |
| `LIVE_PORT_CONGESTION_GENERAL` | `port` | No |
| `WEATHER_FORECAST_GENERAL` | `location`, `window_hours` | No. `window_hours` is a forecast horizon (and was ignored in the probe: the reply said "the next 24 hours") |
| `WEATHER_FORECAST_VERIFY_GENERAL` | `location`, `date` | A past calendar date only. Daily values |

A paid authorization is a 2 minute window with a single-use nonce. So a paid answer is bound to the minute it was
bought, and an answer about an hour that has already passed cannot be bought later. That is the constraint the product
is built on: Wharfinger has to be watching while the ship is in port.

## What follows from it

1. Evidence is created by a watcher running during the stay, not by an analyst afterwards.
2. An interval with no purchase inside it has no evidence. The engine marks it REVIEW or counts it; it never invents
   a receipt.
3. Position, queue and weather are time-bound facts. Only the daily weather observation can be bought about a past
   day, and only at daily resolution.

## What the probe measured (see `PLATFORM_PROBE.md`)

Four operator wallets returned the right position at 95 to 161 seconds old, all relaying one public AIS feed. Five
other answers were wrong, stale or empty. One routed port answer was for a different port. These are the failures the
evidence rules (`packages/evidence`) exist to catch.
