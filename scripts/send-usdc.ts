// Mints test USDC (the test token lets anyone mint) straight to an address. Usage: tsx scripts/send-usdc.ts <address> <uusdc>
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { loadEnv } from "./lib/env.ts";
loadEnv();
const [to, amt] = process.argv.slice(2);
if (!/^0x[0-9a-fA-F]{40}$/.test(to ?? "") || !amt) { console.error("usage: send-usdc.ts <address> <uusdc>"); process.exit(2); }
const acct = privateKeyToAccount(process.env.PROBE_HOUSE_PRIVATE_KEY as `0x${string}`);
const transport = http("https://ethereum-sepolia-rpc.publicnode.com");
const pub = createPublicClient({ chain: sepolia, transport });
const w = createWalletClient({ account: acct, chain: sepolia, transport });
const abi = parseAbi(["function mint(address,uint256)", "function balanceOf(address) view returns (uint256)"]);
const U = "0xcc194e1a843B658526D0D5C431f670028582Ae17" as const;
const before = await pub.readContract({ address: U, abi, functionName: "balanceOf", args: [to as `0x${string}`] });
const h = await w.writeContract({ address: U, abi, functionName: "mint", args: [to as `0x${string}`, BigInt(amt)] });
await pub.waitForTransactionReceipt({ hash: h });
const after = await pub.readContract({ address: U, abi, functionName: "balanceOf", args: [to as `0x${string}`] });
console.log(JSON.stringify({ to, mintedUusdc: amt, balanceBefore: before.toString(), balanceAfter: after.toString(), tx: h }));
