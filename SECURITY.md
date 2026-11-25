# SECURITY

| Topic | Rule |
|---|---|
| Spend caps | The voyage key holds only what the analyst deposited with `depositUSDCFor`; the node refuses the next answer when it runs out. `setMyChargeLimit` caps per block, applied by the node minutes after the transaction. The client also refuses to sign a quote above a cap (default 50,000 uUSDC) and a window over 120 s |
| Keys | Voyage keys derive from `WATCH_MASTER_MNEMONIC` at `m/44'/60'/0'/0/{index}`. The mnemonic lives only in the server environment. Only addresses are shown. No key is logged, printed or committed: `.env*` is gitignored, `scripts/lib/env.ts` never prints values, and CI has no key |
| No server key pays for a user's voyage | A demo voyage uses a separate, labelled house key with a daily ceiling |
| Self-dealing | Our own miner never counts toward corroboration (`packages/evidence`, tested) |
| Evidence | Purchases and signatures are append-only (`packages/db/schema.sql`, trigger) |
| Public data | Asks are public on Telegraph. Vessel names and MMSIs are public record |
| Authorship | No AI attribution: commit-msg hook, `.claude/settings.json`, server-side workflow `no-claude-attribution.yml` |
| Third-party names | `scripts/check-clean.ts` against hashed names in CI |
| Known limits | Probe wallets in the build container are throwaway testnet keys. Zone geometry is a labelled draft. Position corroboration is across operators that share one upstream feed |
| Reporting | Open a private security advisory on the repository |
