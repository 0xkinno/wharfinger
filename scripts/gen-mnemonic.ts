// Generates WATCH_MASTER_MNEMONIC into .env.local if empty. Prints only the first voyage address, never the words.
import { generateMnemonic, english, mnemonicToAccount } from "viem/accounts";
import { loadEnv, setEnvVar } from "./lib/env.ts";
const e = loadEnv(); if (e.WATCH_MASTER_MNEMONIC) { console.log("exists, voyage 0:", mnemonicToAccount(e.WATCH_MASTER_MNEMONIC).address); process.exit(0); }
const m = generateMnemonic(english); setEnvVar("WATCH_MASTER_MNEMONIC", `"${m}"`); console.log("created, voyage 0:", mnemonicToAccount(m).address);
