// House style: no emoji, no em or en dashes, no hype words. Product copy (README and the web app) also bans the
// generic AI vocabulary that rule 4 rules out.
//
// Verbatim third-party quotes are exempt: RULES_EXTRACT.md and anything under evidence/ or reference/.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EXEMPT = [/^apps\/web\/fixtures\//, /^examples\//, /^docs\/sources\//, /^RULES_EXTRACT\.md$/, /^evidence\//, /^reference\//, /^docs\/FACTS\.json$/, /^pnpm-lock\.yaml$/, /^scripts\/check-copy\.ts$/, /^LICENSE$/, /\.(png|jpg|jpeg|gif|woff2?|ico|pdf|mp3|mp4)$/i];
const TEXT_TARGETS = [/\.md$/, /\.(ts|tsx|json|yml|yaml|html|css|svg)$/];
const PRODUCT_COPY = [/^README\.md$/, /^apps\/web\/(app|components|lib|content)\//];

const DASH = /[–—]/;
const EMOJI = /\p{Extended_Pictographic}/u;
const HYPE = /\b(revolutionary|seamless(ly)?|cutting[- ]edge|world[- ]class|zero[- ]trust|military[- ]grade|game[- ]chang(ing|er))\b/i;
const GENERIC_AI = /\b(security layer|trust layer|guardrails?|shield|sentinel|oracle|agent os|transaction polic(y|ies))\b/i;

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { encoding: "utf8" }).split("\n").filter(Boolean);
let failed = 0;
for (const f of files) {
  if (EXEMPT.some((r) => r.test(f)) || !TEXT_TARGETS.some((r) => r.test(f))) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  const product = PRODUCT_COPY.some((r) => r.test(f));
  lines.forEach((line, i) => {
    const probs: string[] = [];
    if (DASH.test(line)) probs.push("en or em dash");
    if (EMOJI.test(line)) probs.push("emoji");
    if (HYPE.test(line)) probs.push(`hype word "${line.match(HYPE)![0]}"`);
    if (product && GENERIC_AI.test(line)) probs.push(`generic AI vocabulary "${line.match(GENERIC_AI)![0]}"`);
    for (const p of probs) { console.error(`${f}:${i + 1}: ${p}`); failed++; }
  });
}
if (failed) { console.error(`check-copy: FAIL (${failed})`); process.exit(1); }
console.log("check-copy: PASS");
