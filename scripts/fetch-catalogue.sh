#!/usr/bin/env bash
# Re-fetches the free discovery data used by the Phase 1 analysis into evidence/probe/catalogue/ (gitignored: it names
# third-party miners). Then `python3 scripts/_ops.py <INTENT>` prints operator and mapping tables.
set -euo pipefail
N="${TELEGRAPH_NODE:-https://devnode.telegraphprotocol.com}"
D="$(dirname "$0")/../evidence/probe/catalogue"; mkdir -p "$D"
curl -fsS "$N/engine/v1/intents" -o "$D/intents_list.json"
curl -fsS "$N/api/miners" -o "$D/miners_all.json"
curl -fsS "$N/leaderboard/miners" -o "$D/leaderboard.json"
for i in VESSEL_TELEMETRY_VERIFY_GENERAL LIVE_PORT_CONGESTION_GENERAL WEATHER_FORECAST_GENERAL WEATHER_FORECAST_VERIFY_GENERAL \
         SANCTIONS_SCREENING_MATCH_GENERAL FX_NOW_EUR SHIP_RATE_ETA_GENERAL DOCUMENT_AUTHENTICITY_GENERAL; do
  curl -fsS "$N/engine/v1/intents/$i" -o "$D/intent_$i.json"
  curl -fsS "$N/engine/v1/intents/$i/miners" -o "$D/intent_${i}_miners.json"
  curl -fsS "$N/api/miners?intent=$i&limit=200" -o "$D/apiminers_$i.json"
done
echo "fetched $(ls "$D" | wc -l) files into $D"
