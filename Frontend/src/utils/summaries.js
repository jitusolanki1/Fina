import api from "../api";

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
  const res = await api.get("/summaries?_sort=createdAt&_order=desc");
  return res.data || [];
}

export async function fetchSummariesBetween(start, end) {
  const res = await api.get(`/summaries?date_gte=${start}&date_lte=${end}`);
  return res.data || [];
}

// Non-destructive preview: compute per-account and overall totals for a date range
export async function previewSummaryRange(start, end) {
  // normalize start/end to YYYY-MM-DD in case Date objects were passed
  start = fmtDate(start);
  end = fmtDate(end);

  // fetch accounts and all transactions in range in parallel (fewer requests)
  const txQuery = `/transactions?date=${start}&date=${end}`;
  const [aRes, txRes] = await Promise.all([
    api.get("/accounts"),
    api.get(txQuery),
  ]);

  const accounts = aRes.data || [];
  const txs = txRes.data || [];

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

  const [aRes, txRes] = await Promise.all([
    api.get("/accounts"),
    api.get(`/transactions?date=${start}&date=${end}`),
  ]);

  const accounts = aRes.data || [];
  const txs = txRes.data || [];

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
      await api.post("/transactionsHistory", {
        ...t,
        archivedAt: new Date().toISOString(),
        summaryRange: `${start} → ${end}`,
      });
      await api.delete(`/transactions/${t.id}`);
    } catch (err) {
      console.error("move transaction error", err);
    }
  }

  // include txCount in the summary so saved record indicates how many transactions were handled
  const txCount = txs.length;

  // update account opening balances
  for (const pa of perAccount) {
    try {
      await api.patch(`/accounts/${pa.accountId}`, {
        openingBalance: pa.openingAfter,
      });
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

  const saved = await api.post("/summaries", summary);
  return saved.data;
}

// undo (revert) a previously created summary: restore archived transactions, delete the rolled opening txs,
// and reset account openingBalance to the "openingBefore" value recorded in the summary.
export async function undoSummary(summaryId) {
  // fetch summary
  const sRes = await api.get(`/summaries/${summaryId}`);
  const summary = sRes.data;
  if (!summary) throw new Error("Summary not found");

  const range = summary.date; // e.g. "2025-11-23 → 2025-11-24"
  const [, end] = range.split("→").map((t) => t.trim());

  for (const pa of summary.perAccount || []) {
    const accId = pa.accountId;
    // find archived transactions for this account and summaryRange
    const q = encodeURIComponent(range);
    const histRes = await api.get(
      `/transactionsHistory?summaryRange=${q}&accountId=${accId}`
    );
    const hist = histRes.data || [];

    for (const h of hist) {
      const toRestore = { ...h };
      delete toRestore.id;
      delete toRestore.archivedAt;
      delete toRestore.summaryRange;
      try {
        await api.post("/transactions", toRestore);
        await api.delete(`/transactionsHistory/${h.id}`);
      } catch (err) {
        console.error("restore history tx", err);
      }
    }

    try {
      const rolledRes = await api.get(
        `/transactions?accountId=${accId}&rolled=true&date=${end}`
      );
      const rolledTxs = rolledRes.data || [];
      for (const r of rolledTxs) {
        try {
          await api.delete(`/transactions/${r.id}`);
        } catch (err) {
          console.error("delete rolled tx", err);
        }
      }
    } catch (err) {
      /* ignore */
    }

    try {
      await api.patch(`/accounts/${accId}`, {
        openingBalance: pa.openingBefore,
      });
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
