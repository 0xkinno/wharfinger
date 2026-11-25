// Funds a house wallet's own escrow so the judge door can buy: mint test USDC (the test token lets anyone mint), approve, depositUSDC.
// Usage: HOUSE_PRIVATE_KEY=0x... pnpm exec tsx scripts/fund-house.ts [uusdc, default 1000000]. The wallet also needs about 0.01 Sepolia ETH.
import { createPublicClient, createWalletClient, http, parseAbi, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { loadEnv } from "./lib/env.ts";
loadEnv();
const key = process.env.HOUSE_PRIVATE_KEY; if (!key) { console.error("set HOUSE_PRIVATE_KEY"); process.exit(2); }
const D = "0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b" as const, U = "0xcc194e1a843B658526D0D5C431f670028582Ae17" as const;
const acct = privateKeyToAccount(key as `0x${string}`); const transport = http(process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com");
const pub = createPublicClient({ chain: sepolia, transport }); const w = createWalletClient({ account: acct, chain: sepolia, transport });
const abi = parseAbi(["function approve(address,uint256) returns (bool)", "function depositUSDC(uint256)", "function mint(address,uint256)", "function balanceOf(address) view returns (uint256)"]);
const amt = BigInt(process.argv[2] ?? 1_000_000);
const eth = await pub.getBalance({ address: acct.address }); console.log("house", acct.address, "ETH", formatEther(eth)); if (eth < 3_000_000_000_000_000n) { console.error("needs at least 0.003 Sepolia ETH for gas"); process.exit(3); }
const bal = await pub.readContract({ address: U, abi, functionName: "balanceOf", args: [acct.address] });
if (bal < amt) await pub.waitForTransactionReceipt({ hash: await w.writeContract({ address: U, abi, functionName: "mint", args: [acct.address, amt - bal] }) });
await pub.waitForTransactionReceipt({ hash: await w.writeContract({ address: U, abi, functionName: "approve", args: [D, amt] }) });
const h = await w.writeContract({ address: D, abi, functionName: "depositUSDC", args: [amt] }); await pub.waitForTransactionReceipt({ hash: h });
console.log("deposited", amt.toString(), "uUSDC into the house escrow, tx", h);
