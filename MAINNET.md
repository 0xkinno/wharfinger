# MAINNET

What changes on mainnet, and what has not been tested. Nothing here has run on mainnet.

| Item | Testnet today | Mainnet |
|---|---|---|
| Chain | Ethereum Sepolia, `eip155:11155111` | Ethereum, `eip155:1`; the signed message names the network, so signatures do not cross chains |
| Escrow | Diamond `0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b` | A different Diamond. Read it from the 402 `payTo`, never hard-code it |
| Settlement token | Test USDC, anyone can mint | Real USDC. The funding flow needs a real balance and approval |
| Receipt proof | Epoch about 4.5 hours (one read); block 52 | Docs say 24 hours. Receipts become provable later |
| Withdraw | `requestWithdraw`, a ledger root at least 30 minutes later plus a 15 minute activation on Sepolia | Fallback after 7 days; timing not measured |
| Gas | A few cents of Sepolia ETH | Real gas for deposit, limit and withdraw; the voyage key needs gas dust |
| EIP-712 domain | `verifyingContract` is the testnet Diamond | The mainnet Diamond; old statements keep verifying against their own domain |
| Key custody | Mnemonic in a server environment variable | A managed secret store or a signer service; voyage key rotation and sweep on close |
| Price | $0.01 floor, multiplier 1.0 | Multiplier rises with demand (docs: tiers by 24 hour volume) |
| Data | Real Digitraffic data, testnet purchases | Same data; legal review of using paid AIS answers as claim evidence is not done |
| Zone geometry | Draft boxes derived from AIS | Chart-derived port limits are required before any statement relies on `PORT_LIMITS` |
