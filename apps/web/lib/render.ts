import ExcelJS from "exceljs";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { SignedStatement } from "../../../packages/statement/src/index.ts";
import { localParts } from "../../../packages/laytime/src/index.ts";

const utc = (m: number) => new Date(m * 60000).toISOString().replace(":00.000Z", "Z").replace("T", " ");
const local = (m: number) => { const p = localParts(m); return `${p.date} ${String(Math.floor(p.mins / 60)).padStart(2, "0")}:${String(p.mins % 60).padStart(2, "0")}`; };
const usd = (uusdc: string | bigint) => { const n = BigInt(uusdc); const neg = n < 0n; const a = neg ? -n : n; return `${neg ? "-" : ""}$${(a / 1_000_000n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${(a % 1_000_000n).toString().padStart(6, "0").slice(0, 2)}`; };
export const money = usd;

export async function statementXlsx(s: SignedStatement): Promise<Buffer> {
  const b = s.body; const wb = new ExcelJS.Workbook(); wb.creator = "Wharfinger"; wb.created = new Date(0);
  const sh = wb.addWorksheet("Laytime", { views: [{ state: "frozen", ySplit: 6 }] });
  sh.addRow([`Laytime statement: ${b.voyage.vessel}, ${b.voyage.port}`]).font = { bold: true, size: 14 };
  sh.addRow([`statementHash ${s.statementHash}`]); sh.addRow([b.labels.sof]); sh.addRow([b.labels.network]); sh.addRow([]);
  const head = sh.addRow(["From (UTC)", "To (UTC)", "From (Helsinki)", "To (Helsinki)", "Minutes", "Class", "Reason", "On demurrage", "SOF line", "Receipts"]); head.font = { bold: true };
  const first = sh.rowCount + 1;
  for (const i of b.result.intervals) sh.addRow([utc(i.from), utc(i.to), local(i.from), local(i.to), i.minutes, i.cls, i.reason, i.onDemurrage ? "yes" : "no", i.sofLine ?? "", i.receipts.join(", ")]);
  const last = sh.rowCount; sh.addRow([]);
  sh.addRow(["", "", "", "Total minutes", { formula: `SUM(E${first}:E${last})` }]);
  sh.addRow(["", "", "", "Counted minutes", { formula: `SUMIF(F${first}:F${last},"COUNTS",E${first}:E${last})` }]);
  sh.addRow(["", "", "", "Excepted minutes", { formula: `SUMIF(F${first}:F${last},"EXCEPTED",E${first}:E${last})` }]);
  sh.addRow(["", "", "", "Review minutes", { formula: `SUMIF(F${first}:F${last},"REVIEW",E${first}:E${last})` }]);
  sh.addRow(["", "", "", "Time on demurrage (min)", b.result.demurrageMinutes]);
  sh.addRow(["", "", "", "Amount (USD, from engine)", usd(b.result.amountUusdc)]);
  sh.columns = [{ width: 22 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 10 }, { width: 11 }, { width: 38 }, { width: 13 }, { width: 9 }, { width: 70 }];
  const t = wb.addWorksheet("Terms"); const tt = b.terms as any;
  for (const [k, v] of Object.entries(tt)) t.addRow([k, Array.isArray(v) ? v.join(", ") : String(v)]); t.columns = [{ width: 28 }, { width: 40 }];
  const r = wb.addWorksheet("Receipts"); r.addRow(["Receipt hash", "Signal hash", "Epoch", "Miner", "Operator", "Source family", "Intent", "Cost (uUSDC)", "Asked at"]).font = { bold: true };
  for (const x of b.receipts) r.addRow([x.receiptHash, x.signalHash, x.epochId ?? "", x.minerId, x.operator, x.family, x.intent, x.costUusdc, x.askedAt]);
  r.columns = [{ width: 68 }, { width: 68 }, { width: 8 }, { width: 10 }, { width: 44 }, { width: 22 }, { width: 34 }, { width: 14 }, { width: 26 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}

const st = StyleSheet.create({ page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#0B1B33" }, h1: { fontSize: 18, marginBottom: 4 }, small: { fontSize: 7, color: "#5B6B82" }, row: { flexDirection: "row", borderBottom: "0.5pt solid #E6E2D8", paddingVertical: 2 }, th: { fontWeight: 700 }, c: { width: "16%" }, c2: { width: "8%" }, c3: { width: "30%" }, box: { marginTop: 10, padding: 6, border: "0.5pt solid #C29A45" } });
export async function statementPdf(s: SignedStatement): Promise<Buffer> {
  const e = React.createElement; const b = s.body;
  const cell = (w: any, t: string, bold = false) => e(Text, { style: [w, bold ? st.th : {}] as any }, t);
  const rows = b.result.intervals.map((i, k) => e(View, { style: st.row, key: k }, cell(st.c, utc(i.from)), cell(st.c, utc(i.to)), cell(st.c2, String(i.minutes)), cell(st.c2, i.cls), cell(st.c3, i.reason + (i.receipts.length ? ` (${i.receipts.length} receipt)` : ""))));
  const doc = e(Document, { title: `Laytime statement ${b.voyage.vessel}` },
    e(Page, { size: "A4", style: st.page },
      e(Text, { style: st.h1 }, `Laytime statement: ${b.voyage.vessel}, ${b.voyage.port}`),
      e(Text, { style: st.small }, b.labels.persona ?? ""), e(Text, { style: st.small }, b.labels.sof ?? ""), e(Text, { style: st.small }, b.labels.network),
      e(View, { style: st.box }, e(Text, null, `Time on demurrage: ${b.result.demurrageMinutes} min   Amount: ${usd(b.result.amountUusdc)}   Counted ${b.result.usedMinutes} min, excepted ${b.result.exceptedMinutes} min, review ${b.result.reviewMinutes} min`),
        e(Text, { style: st.small }, `Rounding: floor on total minutes, integer uUSDC. Engine ${b.engineVersion}. Zone geometry ${b.geometry.version}.`)),
      e(View, { style: { marginTop: 10 } }, e(View, { style: st.row }, cell(st.c, "From (UTC)", true), cell(st.c, "To (UTC)", true), cell(st.c2, "Min", true), cell(st.c2, "Class", true), cell(st.c3, "Reason", true)), ...rows),
      e(View, { style: { marginTop: 10 } }, e(Text, { style: st.th }, `Receipts (${b.receipts.length})`), ...b.receipts.slice(0, 14).map((x, k) => e(Text, { key: k, style: st.small }, `${x.receiptHash.slice(0, 18)}...  signal ${x.signalHash.slice(0, 14)}...  epoch ${x.epochId ?? "pending"}  ${x.family}`))),
      e(View, { style: { marginTop: 10 } }, e(Text, { style: st.small }, `statementHash ${s.statementHash}`),
        e(Text, { style: st.small }, s.analyst ? `Analyst ${s.analyst.address} signed (EIP-712).` : "Not yet signed by the analyst."),
        e(Text, { style: st.small }, s.countersign ? `Owner ${s.countersign.address}: ${s.countersign.decision}${s.countersign.disputedLines.length ? ` lines ${s.countersign.disputedLines.join(", ")}` : ""}` : "Not yet countersigned by the owner."),
        e(Text, { style: st.small }, "Recompute: pnpm verify <statement.json>, or the verify page."))));
  return Buffer.from(await renderToBuffer(doc as any));
}
