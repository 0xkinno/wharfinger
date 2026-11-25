// Tiny .env.local loader and writer (no dependency). Values are never printed.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

export function loadEnv(file = ".env.local"): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#")) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  for (const [k, v] of Object.entries(out)) if (v && process.env[k] === undefined) process.env[k] = v;
  return out;
}
export function setEnvVar(key: string, value: string, file = ".env.local") {
  const lines = existsSync(file) ? readFileSync(file, "utf8").split("\n") : [];
  const i = lines.findIndex((l) => l.startsWith(`${key}=`));
  if (i >= 0) lines[i] = `${key}=${value}`; else lines.push(`${key}=${value}`);
  writeFileSync(file, lines.join("\n").replace(/\n*$/, "\n"), { mode: 0o600 });
}
