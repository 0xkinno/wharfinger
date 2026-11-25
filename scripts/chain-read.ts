// Read-only on-chain probe of the Telegraph Diamond (no keys). Output goes to evidence/probe/.
import { createPublicClient, http, parseAbi, toFunctionSelector, getAbiItem } from "viem";
import { sepolia } from "viem/chains";
import { writeFileSync } from "node:fs";

const RPC = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const DIAMOND = "0x72a70e949362670Bf8bceAd24eFC5b8f950aa08b" as const;
const USDC = "0xcc194e1a843B658526D0D5C431f670028582Ae17" as const;
const client = createPublicClient({ chain: sepolia, transport: http(RPC) });

const loupe = parseAbi([
  "function facets() view returns ((address facetAddress, bytes4[] functionSelectors)[])",
  "function facetAddresses() view returns (address[])",
]);

const out: Record<string, unknown> = { rpc: RPC, diamond: DIAMOND, at: new Date().toISOString() };
out.blockNumber = String(await client.getBlockNumber());
out.code = (await client.getCode({ address: DIAMOND }))?.length;
try {
  const f = await client.readContract({ address: DIAMOND, abi: loupe, functionName: "facets" });
  out.facets = f.map((x) => ({ facet: x.facetAddress, selectors: x.functionSelectors }));
} catch (e) { out.facetsError = String(e).slice(0, 300); }
writeFileSync("evidence/probe/diamond_facets.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify({ block: out.blockNumber, codeLen: out.code, facets: (out.facets as any[] | undefined)?.length, err: out.facetsError }));
