import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("SDK_SURFACE.md does not drift from the code", () => {
  const rows = readFileSync("SDK_SURFACE.md", "utf8").split("\n").filter((l) => /^\| .* \| `[^`]+:\d+` \| `/.test(l));
  it("lists the calls", () => expect(rows.length).toBeGreaterThan(15));
  it.each(rows)("%s", (row) => {
    const m = row.match(/`([^`]+):(\d+)` \| `([^`]+)`/)!; const [, file, line, text] = m;
    const lines = readFileSync(file, "utf8").split("\n");
    expect(lines[Number(line) - 1], `${file}:${line}`).toContain(text.replace("/", "|") === text ? text : text);
  });
});
