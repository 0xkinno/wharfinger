// pnpm verify <statement.json>: recompute a Wharfinger statement offline. No keys, no network.
import { readFileSync } from "node:fs";
import { verifyStatement } from "../packages/statement/src/index.ts";

const file = process.argv[2] ?? "examples/statement.sample.json";
const s = JSON.parse(readFileSync(file, "utf8"));
const out = await verifyStatement(s);
for (const c of out.checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}: ${c.detail}`);
console.log(out.pass ? `\nPASS: ${file} recomputes. statementHash ${s.statementHash}` : `\nFAIL: first mismatch: ${out.firstMismatch}`);
process.exit(out.pass ? 0 : 1);
