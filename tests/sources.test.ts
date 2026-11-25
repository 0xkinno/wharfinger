import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const quotes: any[] = JSON.parse(readFileSync("docs/sources/quotes.json", "utf8"));
const moment = readFileSync("MOMENT.md", "utf8");
const norm = (s: string) => s.replace(new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]", "g"), " to ").replace(/\s+/g, " ");
const quoted = norm(quotes.filter((q) => q.verbatim_checked && q.quote).map((q) => q.quote).join(" "));
const table = moment.slice(moment.indexOf("## Sourced pain table"), moment.indexOf("Not quoted, because"));

describe("sourced pain table", () => {
  it("every money figure in the table appears in a verbatim-checked quote", () => {
    const tokens = table.match(/\$[\d,]+(?:\.\d+)?/g) ?? [];
    expect(tokens.length).toBeGreaterThan(5);
    for (const t of tokens) expect(quoted, `figure ${t} has no quote`).toContain(t);
  });
  it("every other figure (percent, hours, events, billions) is in a quote too", () => {
    for (const f of ["99%", "12 million", "120 million", "6 to 8%", "8 to 10 billion"]) expect(quoted + " " + norm(table), f).toContain(f);
    for (const f of ["99%", "12 million", "120 million", "6" + String.fromCharCode(0x2013) + "8%", "$8" + String.fromCharCode(0x2013) + "10 billion"]) expect(quotes.some((q) => q.verbatim_checked && q.quote?.includes(f)), f).toBe(true);
  });
  it("each entry has a URL and a retrieval date; unverified entries carry no quote", () => {
    for (const q of quotes) { expect(q.url).toMatch(/^https:\/\//); expect(q.retrieved).toBe("2026-11-25"); if (!q.verbatim_checked) expect(q.quote).toBeNull(); }
  });
  it("the unverified source is named as unverified in MOMENT.md, never quoted", () => {
    expect(moment).toContain("Not quoted, because the page could not be read"); expect(moment).toContain("BIMCO"); expect(table).not.toMatch(/BIMCO.*\$/);
  });
  it("the persona example is arithmetic: $18,000 a day is $750 an hour, 41 hours is $30,750", () => {
    expect(18000 / 24).toBe(750); expect(41 * 750).toBe(30750);
  });
});
