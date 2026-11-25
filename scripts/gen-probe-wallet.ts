// Generates a throwaway Sepolia probe wallet into .env.local (PROBE_HOUSE_PRIVATE_KEY). Prints the address only.
// Skips if one already exists. The key never leaves .env.local, which is gitignored.
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { loadEnv, setEnvVar } from "./lib/env.ts";
const env = loadEnv();
if (env.PROBE_HOUSE_PRIVATE_KEY) { console.log("exists:", privateKeyToAccount(env.PROBE_HOUSE_PRIVATE_KEY as `0x${string}`).address); process.exit(0); }
const k = generatePrivateKey(); setEnvVar("PROBE_HOUSE_PRIVATE_KEY", k);
console.log("created:", privateKeyToAccount(k).address);
