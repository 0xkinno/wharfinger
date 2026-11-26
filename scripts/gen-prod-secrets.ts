// Generates fresh disposable testnet credentials for the deployment and writes them to .env.local (gitignored).
// Printing the values is intentional for this one-off: they are throwaway testnet keys the owner asked to receive.
import { generatePrivateKey, privateKeyToAccount, generateMnemonic, english, mnemonicToAccount } from "viem/accounts";
import { randomBytes } from "node:crypto";
import { loadEnv, setEnvVar } from "./lib/env.ts";
loadEnv();
const house = generatePrivateKey(), gas = generatePrivateKey(), mnemonic = generateMnemonic(english), tick = randomBytes(32).toString("hex");
setEnvVar("HOUSE_PRIVATE_KEY", house); setEnvVar("GAS_FUNDER_KEY", gas); setEnvVar("WATCH_MASTER_MNEMONIC", `"${mnemonic}"`); setEnvVar("WATCH_TICK_SECRET", tick);
console.log(JSON.stringify({ HOUSE_PRIVATE_KEY: house, HOUSE_ADDRESS: privateKeyToAccount(house).address, GAS_FUNDER_KEY: gas, GAS_FUNDER_ADDRESS: privateKeyToAccount(gas).address, WATCH_MASTER_MNEMONIC: mnemonic, VOYAGE_0_ADDRESS: mnemonicToAccount(mnemonic).address, WATCH_TICK_SECRET: tick }, null, 1));
