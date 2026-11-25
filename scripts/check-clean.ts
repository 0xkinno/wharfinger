// Fails when a banned third-party name appears in any tracked or untracked-but-unignored file, or in a commit message.
//
// The banned list lives in reference/BANNED_NAMES.txt, which is gitignored (it names other teams).
// CI cannot read that file, so scripts/banned.sha256 holds only hashes of the normalised names.
// A name is normalised by lowercasing and removing every character that is not a letter or digit.
// Text is tokenised on non-alphanumerics, and windows of 1 to 3 consecutive tokens are joined and hashed,
// so "Two Words", "two-words" and "TwoWords" all match the same entry.
//
// Regenerate the hash file after editing the plain list:  pnpm exec tsx scripts/check-clean.ts --write-hashes
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";

const PLAIN = "reference/BANNED_NAMES.txt";
const HASHES = "scripts/banned.sha256";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

if (process.argv.includes("--write-hashes")) {
  if (!existsSync(PLAIN)) { console.error(`${PLAIN} not found`); process.exit(2); }
  const names = readFileSync(PLAIN, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const hashes = [...new Set(names.map((n) => sha(norm(n))))].sort();
  writeFileSync(HASHES, `# sha256 of normalised banned names (see scripts/check-clean.ts). One per line. Names are in reference/BANNED_NAMES.txt, which is not committed.\n${hashes.join("\n")}\n`);
  console.log(`wrote ${hashes.length} hashes to ${HASHES}`);
  process.exit(0);
}

const banned = new Set(readFileSync(HASHES, "utf8").split("\n").map((l) => l.trim()).filter((l) => /^[0-9a-f]{64}$/.test(l)));
if (banned.size === 0) { console.error(`no hashes in ${HASHES}`); process.exit(2); }
const plain = existsSync(PLAIN)
  ? new Map(readFileSync(PLAIN, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((n) => [sha(norm(n)), n] as const))
  : new Map<string, string>();

function scan(text: string): string[] {
  const hits: string[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const toks = lines[i].toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (let a = 0; a < toks.length; a++) {
      let joined = "";
      for (let w = 0; w < 3 && a + w < toks.length; w++) {
        joined += toks[a + w];
        const h = sha(joined);
        if (banned.has(h)) hits.push(`line ${i + 1}: banned name${plain.has(h) ? ` "${plain.get(h)}"` : ""} (hash ${h.slice(0, 8)})`);
      }
    }
  }
  return hits;
}

const git = (args: string[]) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 28 });
const files = git(["ls-files", "-co", "--exclude-standard"]).split("\n").filter(Boolean);
let failed = 0;
for (const f of files) {
  if (f === HASHES) continue;
  let size = 0;
  try { size = statSync(f).size; } catch { continue; }
  if (size > 8 * 1024 * 1024) continue;
  const buf = readFileSync(f);
  if (buf.includes(0)) continue; // binary
  const hits = scan(buf.toString("utf8"));
  for (const h of hits) { console.error(`${f}: ${h}`); failed++; }
}
let commits = "";
try { commits = execFileSync("git", ["log", "--format=%H%n%an %ae%n%B%n--END--", "-n", "500"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28 }); } catch { /* no commits yet */ }
if (commits) {
  for (const h of scan(commits)) { console.error(`commit history: ${h}`); failed++; }
}
if (failed) { console.error(`check-clean: FAIL (${failed} hit${failed === 1 ? "" : "s"})`); process.exit(1); }
console.log(`check-clean: PASS (${files.length} files, ${banned.size} banned hashes)`);
