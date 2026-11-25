// Applies packages/db/schema.sql to DATABASE_URL over HTTPS (Neon serverless driver). Idempotent. Never prints the URL.
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { loadEnv } from "./lib/env.ts";
loadEnv();
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is empty"); process.exit(2); }
const sql = neon(process.env.DATABASE_URL);
/** Splits on semicolons that are not inside a $$ ... $$ body. */
export function splitSql(text: string): string[] {
  const out: string[] = []; let cur = ""; let inDollar = false;
  for (const line of text.split("\n")) {
    if (line.trim().startsWith("--")) continue;
    cur += line + "\n"; if ((line.match(/\$\$/g) ?? []).length % 2 === 1) inDollar = !inDollar;
    if (!inDollar && line.trimEnd().endsWith(";")) { out.push(cur.trim()); cur = ""; }
  }
  if (cur.trim()) out.push(cur.trim()); return out;
}
for (const stmt of splitSql(readFileSync("packages/db/schema.sql", "utf8"))) await sql.query(stmt);
const t = await sql.query("select table_name from information_schema.tables where table_schema='public' order by 1");
console.log("tables:", t.map((r: any) => r.table_name).join(", "));
const g = await sql.query("select tgname from pg_trigger where not tgisinternal order by 1");
console.log("triggers:", g.map((r: any) => r.tgname).join(", "));
