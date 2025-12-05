/*
  Helper to generate an XLSX file from a saved summary and POST it to Formspree.

  Best-practice notes:
  - Generate the workbook on the client to avoid extra server infrastructure for small exports.
  - Use the SheetJS `xlsx` package to build a proper .xlsx file.
  - Post the file as multipart/form-data to the Formspree form endpoint. Formspree accepts file attachments.
  - Keep the function small and testable: returns the fetch Response.

  Usage:
    import { sendSummaryViaFormspree } from '../utils/sendSummaryForm';
    await sendSummaryViaFormspree(summary, 'https://formspree.io/f/mdkqzwqg');

  Requires: `npm install xlsx`
*/

// XLSX is relatively large. Dynamically import it only when we need to generate an export.
import { presignUpload } from "../services/uploadsService";
import { listHistory } from "../services/historyService";

function buildPerAccountRows(summary) {
  const rows = (summary.perAccount || []).map((p) => ({
    AccountName: p.accountName,
    OpeningBefore: Number(p.openingBefore || 0),
    Deposit: Number(p.deposit || 0),
    PenalDeposit: Number(p.penalDeposit || 0),
    UpLineDeposit: Number(p.upLineDeposit || 0),
    OtherDeposit: Number(p.otherDeposit || 0),
    PenalWithdrawal: Number(p.penalWithdrawal || 0),
    UpLineWithdrawal: Number(p.upLineWithdrawal || 0),
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
    { Metric: "UpLine Deposit", Value: Number(o.upLineDeposit || 0) },
    { Metric: "Other Deposit", Value: Number(o.otherDeposit || 0) },
    { Metric: "Penal Withdrawal", Value: Number(o.penalWithdrawal || 0) },
    { Metric: "UpLine Withdrawal", Value: Number(o.upLineWithdrawal || 0) },
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
      "PenalDeposit",
      "UpLineDeposit",
      "OtherDeposit",
      "PenalWithdrawal",
      "UpLineWithdrawal",
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
        csvEscape(p.penalDeposit || 0),
        csvEscape(p.upLineDeposit || 0),
        csvEscape(p.otherDeposit || 0),
        csvEscape(p.penalWithdrawal || 0),
        csvEscape(p.upLineWithdrawal || 0),
        csvEscape(p.otherWithdrawal || 0),
        csvEscape(p.net || 0),
        csvEscape(p.openingAfter || 0),
      ].join(",")
    );
  }

  // If transaction-level rows are available, include them (with Description)
  if (summary.txs && summary.txs.length) {
    lines.push("");
    lines.push(
      [
        "Date",
        "Account",
        "Description",
        "Deposit",
        "PenalDeposit",
        "UpLineDeposit",
        "OtherDeposit",
        "PenalWithdrawal",
        "UpLineWithdrawal",
        "OtherWithdrawal",
        "CreatedBy",
      ].join(",")
    );
    for (const t of summary.txs) {
      lines.push(
        [
          csvEscape(t.date || ""),
          csvEscape(t.accountName || t.account || ""),
          csvEscape(t.description || ""),
          csvEscape(t.deposit || 0),
          csvEscape(t.penalDeposit || 0),
          csvEscape(t.upLineDeposit || 0),
          csvEscape(t.otherDeposit || 0),
          csvEscape(t.penalWithdrawal || 0),
          csvEscape(t.upLineWithdrawal || 0),
          csvEscape(t.otherWithdrawal || 0),
          csvEscape(t.createdBy || ""),
        ].join(",")
      );
    }

    // append totals for transactions
    const totals = summary.txs.reduce(
      (acc, x) => {
        acc.deposit += Number(x.deposit || 0);
        acc.penalDeposit += Number(x.penalDeposit || 0);
        acc.upLineDeposit += Number(x.upLineDeposit || 0);
        acc.otherDeposit += Number(x.otherDeposit || 0);
        acc.penalWithdrawal += Number(x.penalWithdrawal || 0);
        acc.upLineWithdrawal += Number(x.upLineWithdrawal || 0);
        acc.otherWithdrawal += Number(x.otherWithdrawal || 0);
        return acc;
      },
      { deposit: 0, penalDeposit: 0, upLineDeposit: 0, otherDeposit: 0, penalWithdrawal: 0, upLineWithdrawal: 0, otherWithdrawal: 0 }
    );

    lines.push("");
    lines.push([
      "",
      "TOTALS",
      "",
      csvEscape(totals.deposit),
      csvEscape(totals.penalDeposit),
      csvEscape(totals.upLineDeposit),
      csvEscape(totals.otherDeposit),
      csvEscape(totals.penalWithdrawal),
      csvEscape(totals.upLineWithdrawal),
      csvEscape(totals.otherWithdrawal),
      "",
    ].join(","));

    // per-user breakdown
    const perUser = {};
    for (const x of summary.txs) {
      const u = x.createdBy || "Unknown";
      if (!perUser[u]) perUser[u] = { count: 0, deposit: 0, penalDeposit: 0, upLineDeposit: 0, otherDeposit: 0, penalWithdrawal: 0, upLineWithdrawal: 0, otherWithdrawal: 0 };
      perUser[u].count += 1;
      perUser[u].deposit += Number(x.deposit || 0);
      perUser[u].penalDeposit += Number(x.penalDeposit || 0);
      perUser[u].upLineDeposit += Number(x.upLineDeposit || 0);
      perUser[u].otherDeposit += Number(x.otherDeposit || 0);
      perUser[u].penalWithdrawal += Number(x.penalWithdrawal || 0);
      perUser[u].upLineWithdrawal += Number(x.upLineWithdrawal || 0);
      perUser[u].otherWithdrawal += Number(x.otherWithdrawal || 0);
    }

    lines.push("");
    lines.push(["User","Count","Deposit","PenalDeposit","UpLineDeposit","OtherDeposit","PenalWithdrawal","UpLineWithdrawal","OtherWithdrawal","Net"].join(","));
    for (const [u, d] of Object.entries(perUser)) {
      const net = d.deposit + d.penalDeposit + d.upLineDeposit + d.otherDeposit - d.penalWithdrawal - d.upLineWithdrawal - d.otherWithdrawal;
      lines.push([csvEscape(u), csvEscape(d.count), csvEscape(d.deposit), csvEscape(d.penalDeposit), csvEscape(d.upLineDeposit), csvEscape(d.otherDeposit), csvEscape(d.penalWithdrawal), csvEscape(d.upLineWithdrawal), csvEscape(d.otherWithdrawal), csvEscape(net)].join(","));
    }
  }
  lines.push("");
  lines.push("Metric,Value");
  const o = summary.overall || {};
  lines.push(["Opening Total", csvEscape(o.openingTotal || 0)].join(","));
  lines.push(["Deposit", csvEscape(o.deposit || 0)].join(","));
  lines.push(["UpLine Deposit", csvEscape(o.upLineDeposit || 0)].join(","));
  lines.push(["Other Deposit", csvEscape(o.otherDeposit || 0)].join(","));
  lines.push(["Penal Withdrawal", csvEscape(o.penalWithdrawal || 0)].join(","));
  lines.push(["UpLine Withdrawal", csvEscape(o.upLineWithdrawal || 0)].join(","));
  lines.push(["Other Withdrawal", csvEscape(o.otherWithdrawal || 0)].join(","));
  lines.push(["Closing Total", csvEscape(o.closingTotal || 0)].join(","));

  return lines.join("\n");
}

export async function generateSummaryXlsxBlob(summary) {
  const XLSX = await import("xlsx");
  // some bundlers put the library on the `default` export
  const SheetJS = XLSX && XLSX.default ? XLSX.default : XLSX;
  const wb = SheetJS.utils.book_new();

  const paRows = buildPerAccountRows(summary);
  const paSheet = SheetJS.utils.json_to_sheet(paRows, {
    header: Object.keys(paRows[0] || {}),
  });
  SheetJS.utils.book_append_sheet(wb, paSheet, "PerAccount");

  const overallRows = buildOverallRows(summary);
  const overallSheet = SheetJS.utils.json_to_sheet(overallRows);
  SheetJS.utils.book_append_sheet(wb, overallSheet, "Overall");

  // Transactions sheet (if available)
  const txs = summary.txs || summary.transactions || [];
  if (txs && txs.length) {
    const txRows = txs.map((t) => ({
      Date: t.date || "",
      Account: t.accountName || t.account || "",
      Description: t.description || "",
      Deposit: Number(t.deposit || 0),
      PenalDeposit: Number(t.penalDeposit || 0),
      UpLineDeposit: Number(t.upLineDeposit || 0),
      OtherDeposit: Number(t.otherDeposit || 0),
      PenalWithdrawal: Number(t.penalWithdrawal || 0),
      UpLineWithdrawal: Number(t.upLineWithdrawal || 0),
      OtherWithdrawal: Number(t.otherWithdrawal || 0),
      CreatedBy: t.createdBy || "",
    }));
    const txSheet = SheetJS.utils.json_to_sheet(txRows, { header: Object.keys(txRows[0] || {}) });
    SheetJS.utils.book_append_sheet(wb, txSheet, "Transactions");

    // Per-user aggregate sheet
    const perUserMap = {};
    for (const t of txRows) {
      const u = t.CreatedBy || "Unknown";
      if (!perUserMap[u]) perUserMap[u] = { User: u, Count: 0, Deposit: 0, PenalDeposit: 0, UpLineDeposit: 0, OtherDeposit: 0, PenalWithdrawal: 0, UpLineWithdrawal: 0, OtherWithdrawal: 0 };
      perUserMap[u].Count += 1;
      perUserMap[u].Deposit += Number(t.Deposit || 0);
      perUserMap[u].PenalDeposit += Number(t.PenalDeposit || 0);
      perUserMap[u].UpLineDeposit += Number(t.UpLineDeposit || 0);
      perUserMap[u].OtherDeposit += Number(t.OtherDeposit || 0);
      perUserMap[u].PenalWithdrawal += Number(t.PenalWithdrawal || 0);
      perUserMap[u].UpLineWithdrawal += Number(t.UpLineWithdrawal || 0);
      perUserMap[u].OtherWithdrawal += Number(t.OtherWithdrawal || 0);
    }
    const perUserRows = Object.values(perUserMap);
    const puSheet = SheetJS.utils.json_to_sheet(perUserRows, { header: Object.keys(perUserRows[0] || {}) });
    SheetJS.utils.book_append_sheet(wb, puSheet, "PerUser");
  }

  // add metadata sheet
  const meta = [
    { Key: "Date Range", Value: summary.date || "-" },
    { Key: "Created At", Value: summary.createdAt || new Date().toISOString() },
    { Key: "Tx Count", Value: Number(summary.txCount || 0) },
  ];
  const metaSheet = SheetJS.utils.json_to_sheet(meta);
  SheetJS.utils.book_append_sheet(wb, metaSheet, "Metadata");

  const arrayBuf = SheetJS.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([arrayBuf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return blob;
}

export async function sendSummaryViaFormspree(
  summary,
  formUrl = "https://formspree.io/f/mdkqzwqg",
  options = { attachFile: false, replyTo: null, usePresign: true }
) {
  if (!summary) throw new Error("summary required");

  // Build a friendly message body including opening balances by account name
  const openingByAccount = (summary.perAccount || [])
    .map(
      (p) =>
        `${p.accountName}: ${Number(p.openingBefore || 0).toLocaleString()}`
    )
    .join("\n");

  // Primary path: do NOT upload binary files by default — free Formspree forms block attachments.
  // Send a JSON payload (works with Formspree) that includes CSV text and the summary JSON.
  // Try to include transaction-level rows in CSV/XLSX if available. If not present on the summary,
  // attempt to fetch archived transactions for the summary.range (created by createSummaryRange).
  let txs = summary.txs || summary.transactions || null;
  if ((!txs || txs.length === 0) && summary && summary.date) {
    try {
      // history entries created during summary creation include `summaryRange` set to the summary.date
      txs = await listHistory({ summaryRange: summary.date });
    } catch (err) {
      console.info("Could not fetch history transactions for summary", err && err.message);
      txs = null;
    }
  }

  // if we fetched txs, attach to summary for XLSX building
  if (txs && txs.length) summary.txs = txs;

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
  // If presign flow is enabled, try server presign -> upload to storage -> include objectUrl in payload
  if (options && options.usePresign) {
    try {
      const blob = await generateSummaryXlsxBlob(summary);
      const fileName = `summary-${(summary.date || "summary").replace(
        /\s+/g,
        "_"
      )}.xlsx`;

      // ask backend for presigned upload URL
      const presignResp = await presignUpload(
        fileName,
        blob.type ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const { uploadUrl, objectUrl } = presignResp || {};
      if (uploadUrl && objectUrl) {
        // PUT the blob directly to the storage service
        const putResp = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": blob.type || "application/octet-stream" },
          body: blob,
        });

        if (!putResp.ok) {
          throw new Error(
            `Presigned upload failed: ${putResp.status} ${putResp.statusText}`
          );
        }

        // include the object URL in the payload and send JSON form (no binary attachment)
        payload.objectUrl = objectUrl;
        const res = await fetch(formUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          const err = new Error(
            `Formspree JSON submission failed: ${res.status} ${res.statusText}`
          );
          err.responseText = text;
          throw err;
        }

        return res;
      }
    } catch (err) {
      // if presign/upload fails, fall through to other methods
      console.info(
        "Presign/upload failed, falling back to Formspree paths",
        err && err.message
      );
    }
  }

  if (options && options.attachFile) {
    try {
      const blob = await generateSummaryXlsxBlob(summary);
      const fileName = `summary-${(summary.date || "summary").replace(
        /\s+/g,
        "_"
      )}.xlsx`;
      const file = new File([blob], fileName, { type: blob.type });

      const formData = new FormData();
      formData.append("attachment", file);
      formData.append("subject", payload.subject);
      formData.append("message", payload.message);
      formData.append("summaryJson", JSON.stringify(summary));
      if (options && options.replyTo)
        formData.append("_replyto", options.replyTo);

      const response = await fetch(formUrl, { method: "POST", body: formData });
      if (response.ok) return response;

      // if upload not permitted, fall through to JSON send
      const text = await response.text().catch(() => "");
      if (
        response.status === 400 &&
        typeof text === "string" &&
        (text.includes("File Uploads Not Permitted") ||
          text.includes("does not support file uploads"))
      ) {
        // continue to JSON fallback
      } else {
        const err = new Error(
          `Formspree upload failed: ${response.status} ${response.statusText}`
        );
        err.responseText = text;
        throw err;
      }
    } catch (err) {
      // if any error during file upload path, we'll try JSON fallback below
      console.info(
        "Attachment upload failed, falling back to JSON send",
        err && err.message
      );
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
    const err = new Error(
      `Formspree JSON submission failed: ${res.status} ${res.statusText}`
    );
    err.responseText = text;
    throw err;
  }

  return res;
}

export default sendSummaryViaFormspree;
