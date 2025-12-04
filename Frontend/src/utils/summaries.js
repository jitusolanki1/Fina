import api from "../api";
import { listAccounts, updateAccount } from "../services/accountsService";
import { listTransactions, deleteTransaction } from "../services/transactionService";
import { createSummary, listSummaries, getSummary, deleteSummary } from "../services/summariesService";
import { createHistory, listHistory, deleteHistory } from "../services/historyService";

function fmtDate(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function dateDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtDate(d);
}

export async function fetchSummaries() {
  const res = await listSummaries({ _sort: 'createdAt', _order: 'desc' });
  return res || [];
}

export async function fetchSummariesBetween(start, end) {
  const res = await listSummaries({ date_gte: start, date_lte: end });
  return res || [];
}

// Non-destructive preview: compute per-account and overall totals for a date range
export async function previewSummaryRange(start, end) {
  // normalize start/end to YYYY-MM-DD in case Date objects were passed
  start = fmtDate(start);
  end = fmtDate(end);

  // fetch accounts and all transactions in range in parallel (fewer requests)
  const [accounts, txs] = await Promise.all([
    listAccounts(),
    listTransactions({ date_gte: start, date_lte: end }),
  ]);

  // group transactions by accountId
  const txByAccount = txs.reduce((acc, t) => {
    const k = t.accountId || "__none__";
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {});

  const perAccount = [];
  let overall = {
    openingTotal: 0,
    deposit: 0,
    otherDeposit: 0,
    penalWithdrawal: 0,
    otherWithdrawal: 0,
    closingTotal: 0,
  };

  for (const acc of accounts) {
    const list = txByAccount[acc.id] || [];

    const deposit = list.reduce((s, t) => s + Number(t.deposit || 0), 0);
    const otherDeposit = list.reduce(
      (s, t) => s + Number(t.otherDeposit || 0),
      0
    );
    const penalWithdrawal = list.reduce(
      (s, t) => s + Number(t.penalWithdrawal || 0),
      0
    );
    const otherWithdrawal = list.reduce(
      (s, t) => s + Number(t.otherWithdrawal || 0),
      0
    );

    const openingBefore = Number(acc.openingBalance || 0);
    const net = deposit + otherDeposit - penalWithdrawal - otherWithdrawal;
    const openingAfter = openingBefore + net;

    perAccount.push({
      accountId: acc.id,
      accountName: acc.name,
      openingBefore,
      txCount: list.length,
      deposit,
      otherDeposit,
      penalWithdrawal,
      otherWithdrawal,
      net,
      openingAfter,
    });

    overall.openingTotal += openingBefore;
    overall.deposit += deposit;
    overall.otherDeposit += otherDeposit;
    overall.penalWithdrawal += penalWithdrawal;
    overall.otherWithdrawal += otherWithdrawal;
    overall.closingTotal += openingAfter;
  }

  const txSample = txs
    .slice(0, 10)
    .map((t) => ({ id: t.id, accountId: t.accountId }));
  const txQuery = `/transactions?date_gte=${encodeURIComponent(
    start
  )}&date_lte=${encodeURIComponent(end)}`;
  return { perAccount, overall, txCount: txs.length, txQuery, txSample };
}

export function aggregateSummaries(list) {
  const overall = list.reduce(
    (acc, s) => {
      acc.openingTotal += Number(s.overall?.openingTotal || 0);
      acc.deposit += Number(s.overall?.deposit || 0);
      acc.otherDeposit += Number(s.overall?.otherDeposit || 0);
      acc.penalWithdrawal += Number(s.overall?.penalWithdrawal || 0);
      acc.otherWithdrawal += Number(s.overall?.otherWithdrawal || 0);
      acc.closingTotal += Number(s.overall?.closingTotal || 0);
      return acc;
    },
    {
      openingTotal: 0,
      deposit: 0,
      otherDeposit: 0,
      penalWithdrawal: 0,
      otherWithdrawal: 0,
      closingTotal: 0,
    }
  );
  return { overall };
}

export async function createSummaryRange(start, end) {
  // normalize dates to YYYY-MM-DD
  start = fmtDate(start);
  end = fmtDate(end);

  const [accounts, txs] = await Promise.all([
    listAccounts(),
    listTransactions({ date_gte: start, date_lte: end }),
  ]);

  const txByAccount = txs.reduce((acc, t) => {
    const k = t.accountId || "__none__";
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {});

  const perAccount = [];
  let overall = {
    openingTotal: 0,
    deposit: 0,
    otherDeposit: 0,
    penalWithdrawal: 0,
    otherWithdrawal: 0,
    closingTotal: 0,
  };

  // compute per-account totals
  for (const acc of accounts) {
    const list = txByAccount[acc.id] || [];

    const deposit = list.reduce((s, t) => s + Number(t.deposit || 0), 0);
    const otherDeposit = list.reduce(
      (s, t) => s + Number(t.otherDeposit || 0),
      0
    );
    const penalWithdrawal = list.reduce(
      (s, t) => s + Number(t.penalWithdrawal || 0),
      0
    );
    const otherWithdrawal = list.reduce(
      (s, t) => s + Number(t.otherWithdrawal || 0),
      0
    );

    const openingBefore = Number(acc.openingBalance || 0);
    const net = deposit + otherDeposit - penalWithdrawal - otherWithdrawal;
    const openingAfter = openingBefore + net;

    perAccount.push({
      accountId: acc.id,
      accountName: acc.name,
      openingBefore,
      deposit,
      otherDeposit,
      penalWithdrawal,
      otherWithdrawal,
      net,
      openingAfter,
    });

    overall.openingTotal += openingBefore;
    overall.deposit += deposit;
    overall.otherDeposit += otherDeposit;
    overall.penalWithdrawal += penalWithdrawal;
    overall.otherWithdrawal += otherWithdrawal;
    overall.closingTotal += openingAfter;
  }

  // archive all transactions (post to history then delete)
  for (const t of txs) {
    try {
      await createHistory({ ...t, archivedAt: new Date().toISOString(), summaryRange: `${start} → ${end}` });
      await deleteTransaction(t.id);
    } catch (err) {
      console.error("move transaction error", err);
    }
  }

  // include txCount in the summary so saved record indicates how many transactions were handled
  const txCount = txs.length;

  // update account opening balances
  for (const pa of perAccount) {
    try {
      await updateAccount(pa.accountId, { openingBalance: pa.openingAfter });
    } catch (err) {
      console.error("update account openingBalance", err);
    }
  }

  const summary = {
    date: `${start} → ${end}`,
    createdAt: new Date().toISOString(),
    perAccount,
    overall,
    txCount,
  };

  const saved = await createSummary(summary);
  return saved;
}

// undo (revert) a previously created summary: restore archived transactions, delete the rolled opening txs,
// and reset account openingBalance to the "openingBefore" value recorded in the summary.
export async function undoSummary(summaryId) {
  // fetch summary
  const summary = await getSummary(summaryId);
  if (!summary) throw new Error("Summary not found");

  const range = summary.date; // e.g. "2025-11-23 → 2025-11-24"
  const [, end] = range.split("→").map((t) => t.trim());

  for (const pa of summary.perAccount || []) {
    const accId = pa.accountId;
    // find archived transactions for this account and summaryRange
    const q = encodeURIComponent(range);
    const hist = await listHistory({ summaryRange: range, accountId: accId }) || [];

    for (const h of hist) {
      const toRestore = { ...h };
      delete toRestore.id;
      delete toRestore.archivedAt;
      delete toRestore.summaryRange;
        try {
        await api.post("/transactions", toRestore);
        await deleteHistory(h.id);
      } catch (err) {
        console.error("restore history tx", err);
      }
    }

    try {
      const rolledTxs = await listTransactions({ accountId: accId, rolled: true, date: end }) || [];
      for (const r of rolledTxs) {
        try {
          await deleteTransaction(r.id);
        } catch (err) {
          console.error("delete rolled tx", err);
        }
      }
    } catch (err) {
      /* ignore */
    }

    try {
      await updateAccount(accId, { openingBalance: pa.openingBefore });
    } catch (err) {
      console.error("revert openingBalance", err);
    }
  }

  try {
    await api.delete(`/summaries/${summaryId}`);
  } catch (err) {
    console.error("delete summary", err);
  }

  return { ok: true };
}

export async function generateDailySummary(targetDate) {
  const start = targetDate;
  const end = targetDate;
  return createSummaryRange(start, end);
}

function ymd(d) {
  return d.toISOString().slice(0, 10);
}
