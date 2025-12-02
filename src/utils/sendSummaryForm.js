/*
  Helper to generate an XLSX file from a saved summary and POST it to Formspree.

  Best-practice notes:
  - Generate the workbook on the client to avoid extra server infrastructure for small exports.
  - Use the SheetJS `xlsx` package to build a proper .xlsx file.
  - Post the file as multipart/form-data to the Formspree form endpoint. Formspree accepts file attachments.
  - Keep the function small and testable: returns the fetch Response.

  Usage:
    import { sendSummaryViaFormspree } from '../utils/sendSummaryForm';
    await sendSummaryViaFormspree(summary, 'https://formspree.io/f/meoyegdl');

  Requires: `npm install xlsx`
*/

import * as XLSX from "xlsx";

function buildPerAccountRows(summary) {
  const rows = (summary.perAccount || []).map((p) => ({
    AccountName: p.accountName,
    OpeningBefore: Number(p.openingBefore || 0),
    Deposit: Number(p.deposit || 0),
    OtherDeposit: Number(p.otherDeposit || 0),
    PenalWithdrawal: Number(p.penalWithdrawal || 0),
    OtherWithdrawal: Number(p.otherWithdrawal || 0),
    Net: Number(p.net || 0),
    OpeningAfter: Number(p.openingAfter || 0),
  }));
  return rows;
}

function buildOverallRows(summary) {
  const o = summary.overall || {};
  return [
    {
      Metric: "Opening Total",
      Value: Number(o.openingTotal || 0),
    },
    { Metric: "Deposit", Value: Number(o.deposit || 0) },
    { Metric: "Other Deposit", Value: Number(o.otherDeposit || 0) },
    { Metric: "Penal Withdrawal", Value: Number(o.penalWithdrawal || 0) },
    { Metric: "Other Withdrawal", Value: Number(o.otherWithdrawal || 0) },
    { Metric: "Closing Total", Value: Number(o.closingTotal || 0) },
  ];
}

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // if contains comma or quote or newline, wrap in double quotes and escape quotes
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildCsvString(summary) {
  const lines = [];
  lines.push(`Date Range:,${csvEscape(summary.date || "")}`);
  lines.push(`Created At:,${csvEscape(summary.createdAt || "")}`);
  lines.push(`Tx Count:,${csvEscape(summary.txCount || 0)}`);
  lines.push("");

  // Per-account header
  lines.push(
    [
      "AccountName",
      "OpeningBefore",
      "Deposit",
      "OtherDeposit",
      "PenalWithdrawal",
      "OtherWithdrawal",
      "Net",
      "OpeningAfter",
    ].join(",")
  );

  for (const p of summary.perAccount || []) {
    lines.push(
      [
        csvEscape(p.accountName),
        csvEscape(p.openingBefore || 0),
        csvEscape(p.deposit || 0),
        csvEscape(p.otherDeposit || 0),
        csvEscape(p.penalWithdrawal || 0),
        csvEscape(p.otherWithdrawal || 0),
        csvEscape(p.net || 0),
        csvEscape(p.openingAfter || 0),
      ].join(",")
    );
  }

  lines.push("");
  lines.push("Metric,Value");
  const o = summary.overall || {};
  lines.push(["Opening Total", csvEscape(o.openingTotal || 0)].join(","));
  lines.push(["Deposit", csvEscape(o.deposit || 0)].join(","));
  lines.push(["Other Deposit", csvEscape(o.otherDeposit || 0)].join(","));
  lines.push(["Penal Withdrawal", csvEscape(o.penalWithdrawal || 0)].join(","));
  lines.push(["Other Withdrawal", csvEscape(o.otherWithdrawal || 0)].join(","));
  lines.push(["Closing Total", csvEscape(o.closingTotal || 0)].join(","));

  return lines.join("\n");
}

export async function generateSummaryXlsxBlob(summary) {
  const wb = XLSX.utils.book_new();

  const paRows = buildPerAccountRows(summary);
  const paSheet = XLSX.utils.json_to_sheet(paRows, {
    header: Object.keys(paRows[0] || {}),
  });
  XLSX.utils.book_append_sheet(wb, paSheet, "PerAccount");

  const overallRows = buildOverallRows(summary);
  const overallSheet = XLSX.utils.json_to_sheet(overallRows);
  XLSX.utils.book_append_sheet(wb, overallSheet, "Overall");

  // add metadata sheet
  const meta = [
    { Key: "Date Range", Value: summary.date || "-" },
    { Key: "Created At", Value: summary.createdAt || new Date().toISOString() },
    { Key: "Tx Count", Value: Number(summary.txCount || 0) },
  ];
  const metaSheet = XLSX.utils.json_to_sheet(meta);
  XLSX.utils.book_append_sheet(wb, metaSheet, "Metadata");

  const arrayBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([arrayBuf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return blob;
}

export async function sendSummaryViaFormspree(
  summary,
  formUrl = "https://formspree.io/f/meoyegdl",
  options = { attachFile: false, replyTo: null }
) {
  if (!summary) throw new Error("summary required");

  // Build a friendly message body including opening balances by account name
  const openingByAccount = (summary.perAccount || [])
    .map((p) => `${p.accountName}: ${Number(p.openingBefore || 0).toLocaleString()}`)
    .join("\n");

  // Primary path: do NOT upload binary files by default — free Formspree forms block attachments.
  // Send a JSON payload (works with Formspree) that includes CSV text and the summary JSON.
  const csv = buildCsvString(summary);
  const payload = {
    subject: `Summary ${summary.date || "(range)"}`,
    message: `Automatic export: CSV included below.\n\nOpening balances:\n${openingByAccount}`,
    csv,
    summaryJson: summary,
  };

  // include reply-to if provided
  if (options && options.replyTo) payload._replyto = options.replyTo;

  // If caller explicitly requested an attached file, attempt upload and fallback to JSON.
  if (options && options.attachFile) {
    try {
      const blob = await generateSummaryXlsxBlob(summary);
      const fileName = `summary-${(summary.date || "summary").replace(/\s+/g, "_")}.xlsx`;
      const file = new File([blob], fileName, { type: blob.type });

      const formData = new FormData();
      formData.append("attachment", file);
      formData.append("subject", payload.subject);
      formData.append("message", payload.message);
      formData.append("summaryJson", JSON.stringify(summary));
      if (options && options.replyTo) formData.append("_replyto", options.replyTo);

      const response = await fetch(formUrl, { method: "POST", body: formData });
      if (response.ok) return response;

      // if upload not permitted, fall through to JSON send
      const text = await response.text().catch(() => "");
      if (response.status === 400 && typeof text === "string" && (text.includes("File Uploads Not Permitted") || text.includes("does not support file uploads"))) {
        // continue to JSON fallback
      } else {
        const err = new Error(`Formspree upload failed: ${response.status} ${response.statusText}`);
        err.responseText = text;
        throw err;
      }
    } catch (err) {
      // if any error during file upload path, we'll try JSON fallback below
      console.info("Attachment upload failed, falling back to JSON send", err && err.message);
    }
  }

  // JSON send (safe for free Formspree forms)
  const res = await fetch(formUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Formspree JSON submission failed: ${res.status} ${res.statusText}`);
    err.responseText = text;
    throw err;
  }

  return res;
}

export default sendSummaryViaFormspree;
