// Renders social/*.svg to 3200x1800 JPG with the app's own fonts. Usage: node scripts/render-social.mjs
import { createRequire } from "node:module"; import { readFileSync, writeFileSync, readdirSync, mkdtempSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path"; import { pathToFileURL } from "node:url";
const { chromium } = createRequire(import.meta.url)("playwright");
const nm = "apps/web/node_modules"; const f = (p) => pathToFileURL(`${process.cwd()}/${nm}/${p}`).href;
const css = `@font-face{font-family:Fraunces;src:url(${f("@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2")});font-weight:100 900}
@font-face{font-family:"Instrument Sans";src:url(${f("@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2")});font-weight:400 700}
@font-face{font-family:"IBM Plex Mono";src:url(${f("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2")});font-weight:400}`;
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 })).newPage();
for (const n of readdirSync("social").filter((x) => x.endsWith(".svg"))) {
  const dir = mkdtempSync(join(tmpdir(), "soc-")); const page = join(dir, "p.html"); // a file page, so the font files can load
  writeFileSync(page, `<!doctype html><meta charset=utf-8><style>${css}html,body{margin:0;background:#06101D}svg{display:block}</style>${readFileSync(`social/${n}`, "utf8")}`); await p.goto(pathToFileURL(page).href); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  writeFileSync(`social/${n.replace(".svg", ".jpg")}`, await p.screenshot({ type: "jpeg", quality: 93 })); console.log("rendered", n);
}
await b.close();
