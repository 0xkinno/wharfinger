# RUNBOOK

Operating the watcher. The web app and scheduler are not deployed yet; the commands below run the same code from a shell.

| Task | Command |
|---|---|
| Check the probe wallets and escrow | `pnpm probe:paid -- --stage=balances` |
| One live tick for a vessel already in port | `NODE_USE_ENV_PROXY=1 pnpm exec tsx scripts/live-tick.ts <mmsi> <LOCODE> [port query or none]` |
| Verify a statement offline | `pnpm verify <statement.json>` |
| Run all tests | `pnpm test` |
| Check house rules | `pnpm check:clean && pnpm check:copy && pnpm typecheck` |

## Recovery

| Event | What happens | What you do |
|---|---|---|
| Duplicate tick | A lease row per voyage per 30 minute slot refuses the second tick | Nothing |
| Node refusal for balance | The watcher marks BUDGET_SPENT, stops, and does not retry with another key | Deposit more with `depositUSDCFor`, then resume |
| Charge limit reached | The refusal text is stored; the next block resets it | Wait or raise the limit |
| Provider error (500, 503) | Not billed; the next operator is tried, up to 4 attempts per fact | Nothing |
| Wrong or stale answer | Stored with its refusal code; a different operator is bought | Review `purchases` |
| Withdraw stalls | The status stays `waiting_root`; shown as "pending since" | Wait; the 7 day fallback exists |
| Restart | Leases and purchases are durable; unfinished slots are retried next slot | Nothing |
