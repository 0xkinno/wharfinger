#!/usr/bin/env python3
"""Builds packages/evidence/src/operators.json from the catalogue (run scripts/fetch-catalogue.sh first).
operator = registrant wallet (wallet_address). family = the upstream feed, with the basis for the label."""
import json, os, collections
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
cat = os.path.join(root, "evidence", "probe", "catalogue")
INTENTS = ["VESSEL_TELEMETRY_VERIFY_GENERAL", "LIVE_PORT_CONGESTION_GENERAL"]
# Measured on 2026-11-25 (evidence/probe/paid/asks_matrix.json): these miners returned the same position as the public
# AIS feed to six decimals, so they are labelled as relaying it.
MEASURED_SAME = {"txlens", "a1-preflight", "chainsight-oracle"}
def family(m):
    host = (m.get("base_url") or "").lower(); slug = m["slug"]
    if "digitraffic" in host: return "digitraffic-ais", "base_url host"
    if "adsb.lol" in host: return "adsb-aircraft", "base_url host (aircraft tracker, not ships)"
    if "margyn.workers.dev" in host: return "digitraffic-ais", "one hosted worker; two of four descriptions name Digitraffic"
    if slug in MEASURED_SAME: return "digitraffic-ais", "answers identical to the public AIS feed to six decimals in the 2026-11-25 probe"
    if slug == "quay-ais": return "shore-ais-quay", "own description: shore-based AIS receivers"
    return "unknown:" + slug, "no declared upstream"
out = {"builtFrom": "catalogue fetched via scripts/fetch-catalogue.sh", "miners": {}}
for i in INTENTS:
    s = json.load(open(os.path.join(cat, f"intent_{i}.json")))
    api = {m["id"]: m for m in json.load(open(os.path.join(cat, f"apiminers_{i}.json")))}
    for m in s["miners"]:
        a = api.get(m["id"], {})
        fam, basis = family({**a, "slug": m["slug"]})
        out["miners"].setdefault(m["id"], {"slug": m["slug"], "operator": (a.get("wallet_address") or "").lower(), "intents": [], "family": fam, "familyBasis": basis})["intents"].append(i)
json.dump(out, open(os.path.join(root, "packages", "evidence", "src", "operators.json"), "w"), indent=1)
print(len(out["miners"]), "miners;", dict(collections.Counter(v["family"] for v in out["miners"].values())))
