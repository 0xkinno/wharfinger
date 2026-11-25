# JUDGE

How to run, check, inspect, break and reproduce Wharfinger. Live app: https://wharfinger-kinnoskis-projects.vercel.app

## In 60 seconds

1. Open `/judge`. Choose a ship that is in port now and press **Buy two answers**. The house key buys on Telegraph testnet; you see
   miner, receipt, signal link and which operators agreed. If the first answer is stale or for the wrong place it is refused and
   re-bought.
2. Open `/statement/iceland-fiktk-preloaded` for a statement built from real answers, with PDF, XLSX and JSON.
3. Press **Tamper one minute** on `/judge`: a recompute in the browser fails at that line.

## In 3 minutes

4. `/verify/iceland-fiktk-preloaded`: **Recompute in this browser**. It re-runs the laytime engine from the statement's inputs,
   re-derives each signal hash, and fetches each signal from the node to compare.
5. `/voyage/iceland-fiktk-preloaded`: every purchase with operator, source family, cost, latency, three clocks, verdict.
6. `/evidence`: every refusal with its reason, pass rate per miner and per operator.

## In 10 minutes

7. Connect a wallet on Sepolia at `/voyage/new` to fund a voyage (the app mints test USDC if you hold none). Requires the
   deployment to have `DATABASE_URL`, `WATCH_MASTER_MNEMONIC` and `HOUSE_PRIVATE_KEY` (`DEPLOY.md`); otherwise the form says what is missing.
8. Offline reproduction: `pnpm install && pnpm test && pnpm verify examples/statement.sample.json`.
9. Inspect the node yourself: `/api/status`, `https://devnode.telegraphprotocol.com/engine/v1/signal/<hash>` for any signal hash shown.

## Mission acceptance, the five verbs

| Verb | Where |
|---|---|
| Run it | `/judge`, `/voyage/new` |
| Check it | `/statement/<id>`, `/verify/<id>` |
| Inspect it | `/voyage/<id>`, `/evidence`, `/trace`, `SDK_SURFACE.md` |
| Break it | `/judge` failure buttons: wrong place, stale, operators disagree, obedient model, budget drain, tamper |
| Reproduce it | `README.md` "Run it", `TUTORIAL.md` |

## What not to expect

Hourly rain observations, independent corroboration of position beyond the upstream feed, a Kotka port queue, chart-derived port
limits, mainnet. Each is stated in the README and `PLATFORM_PROBE.md`. The budget-drain button reads a recorded run; if none is
recorded yet it says so.
