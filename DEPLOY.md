# DEPLOY

Wharfinger runs on Vercel (app and API routes), Neon Postgres (state), and a GitHub Actions schedule (the 30 minute tick).
Vercel project: `wharfinger`, linked to this repository, root directory `apps/web`, production branch `main`.

## What works with no secrets

With only the public settings below, the deployed app serves the real preloaded voyage (MV Iceland at Kotka) from committed
fixtures: landing, harbour, voyage, statement (PDF, XLSX, JSON), browser verify, evidence, trace, judge failure buttons.
`/api/stats` says its source is "committed fixtures". Nothing is faked: the fixtures are real purchases and signed statements.

## Public settings (already set in Vercel)

`NEXT_PUBLIC_REOWN_PROJECT_ID` (test project id for this hackathon), `NEXT_PUBLIC_SEPOLIA_RPC_URL`, `TELEGRAPH_NODE`,
`TELEGRAPH_CHAIN_ID`, `TELEGRAPH_DIAMOND`, `TELEGRAPH_USDC`, `DIGITRAFFIC_USER`.

## Secrets that turn on the live features (set in Vercel > Project > Settings > Environment Variables, mark Sensitive)

| Variable | Turns on | Where to get it |
|---|---|---|
| `DATABASE_URL` | Voyages, purchases, signatures stored; the tick; signing | **Fastest, keeps the seeded data:** claim the database already created for this project at https://neon.new/claim/01a212bc-0c3b-74c5-91e5-56fc83eb7d33 (free Neon account; it is deleted on 2026-11-28 if unclaimed), then Neon console > Connect > pooled connection string. **Or** Vercel > Storage > Create > Neon (sets `DATABASE_URL` for you). Either way the app applies the schema and imports the preloaded voyage by itself on first request |
| `WATCH_TICK_SECRET` | The 30 minute tick route | `openssl rand -hex 32`. Put the same value in Vercel and in GitHub > repo > Settings > Secrets and variables > Actions > Secrets (`WATCH_TICK_SECRET`) |
| `WATCH_MASTER_MNEMONIC` | Per-voyage keys for user voyages | A fresh 12 word phrase made offline: `cast wallet new-mnemonic`, or any offline BIP39 tool. Voyage keys derive at `m/44'/60'/0'/0/{index}`. Losing it strands the escrow of voyages still running |
| `HOUSE_PRIVATE_KEY` | The judge door (house key buys the first two answers), gas top-ups, per-block limits | A new throwaway Sepolia account: `cast wallet new`, or create an account in MetaMask or Rabby and export its key. Send it about 0.02 Sepolia ETH (Google Cloud Web3 faucet, Alchemy Sepolia faucet or another). Then run `HOUSE_PRIVATE_KEY=0x... pnpm exec tsx scripts/fund-house.ts` to mint test USDC and deposit 1.00 USDC into its escrow |
| `GAS_FUNDER_KEY` | Optional; falls back to the house key | Same as above, or leave unset |

GitHub repository variable `WHARFINGER_URL` (Settings > Secrets and variables > Actions > Variables) is the production URL, without a trailing slash.
After setting variables, redeploy once (Vercel > Deployments > Redeploy, or push to `main`).

## Checks after a deploy

```bash
curl -s $URL/api/status      # node, house escrow, database, chain: measured, nothing hard-coded
curl -s $URL/api/stats       # source says "database" once DATABASE_URL is set
curl -s -X POST $URL/api/watch/tick -H "authorization: Bearer $WATCH_TICK_SECRET"
BASE=$URL node e2e/smoke.mjs # browser suite: console, overflow, overlap, axe
```

## Why the secrets are not set by the build agent

The agent's safety classifier refused to read secret values out of the local `.env.local` into the session, which every Vercel
variable call would require. The app was therefore built to degrade honestly without them.
