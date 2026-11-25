// Match unresolved Diamond selectors against candidate names x argument type lists. Read-only, offline.
import { toFunctionSelector } from "viem";
import { readFileSync, writeFileSync } from "node:fs";

const sel = JSON.parse(readFileSync("evidence/probe/diamond_selectors.json", "utf8")) as Record<string, string[] | null>;
const unknown = new Set(Object.entries(sel).filter(([, v]) => !v).map(([k]) => k));

const names = [
  "setMyChargeLimit","setChargeLimit","chargeLimit","chargeLimitOf","myChargeLimit","getChargeLimit","chargeLimits","setAccountChargeLimit","setMaxChargePerBlock",
  "executeWithdraw","executeWithdrawFallback","withdraw","withdrawUSDC","claimWithdraw","finalizeWithdraw",
  "ledgerAccount","ledgerAccounts","accountOf","balanceOf","deposited","withdrawn","requestedWithdraw","withdrawRequest","withdrawalRequest","withdrawRequestOf",
  "getLedgerAccount","escrowBalance","escrowOf","depositOf","totalDeposited","totalEscrow","usdcBalance",
  "submitEpoch","submitLedgerRoot","activeRoot","activeLedgerRoot","ledgerRoot","ledgerRootAt","rootCount","ledgerSeq","currentSeq","withdrawDelay","withdrawalDelay","activationDelay",
  "fallbackDelay","withdrawFallbackDelay","charge","chargeBlock","chargedThisBlock","blockCharged","setBlockLength","blockLength",
  "depositUSDCWithSig","depositFor","depositUSDCBySig","depositUSDCForWithSig","setChargeLimitFor","setChargeLimitWithSig","setMyChargeLimitFor",
  "pendingWithdrawal","withdrawalStatus","withdrawalRequest","getWithdrawalRequest","requestedAt","withdrawRequestedAt","chargeLimitFor","accountLimit","limitOf","spendLimit","setSpendLimit","setMySpendLimit","maxChargePerBlock",
];
const T = ["address","uint256","bytes32","bytes","uint64","uint32","uint128","bool","uint256[]","bytes32[]","bytes[]","uint8","address[]","string"];
const argLists: string[][] = [[]];
for (const a of T) argLists.push([a]);
for (const a of T) for (const b of T) argLists.push([a, b]);
for (const a of ["uint256","address","bytes32","uint64"]) for (const b of ["uint256","bytes32[]","bytes32","address","bytes","uint64","bytes[]"]) for (const c of ["bytes32[]","bytes","uint256","bytes32","address","bytes[]","uint256[]"]) argLists.push([a, b, c]);
const found: Record<string, string> = {};
for (const n of names) for (const al of argLists) {
  const sig = `${n}(${al.join(",")})`;
  const s = toFunctionSelector(sig);
  if (unknown.has(s)) found[s] = sig;
}
writeFileSync("evidence/probe/diamond_selectors_matched.json", JSON.stringify(found, null, 1));
console.log(JSON.stringify(found, null, 1));
console.log("unknown selectors:", unknown.size, "matched:", Object.keys(found).length);
