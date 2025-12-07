import express from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import Account from "../models/Account.js";
import { octokitForToken, ensureRepoExists, createOrUpdateFile } from "../services/githubService.js";
import { generateAccountXLS } from "../utils/fileGenerator.js";
import Transaction from "../models/Transaction.js";
import TransactionHistory from "../models/TransactionHistory.js";
import Summary from "../models/Summary.js";
import mongoose from "mongoose";
import { dailyFolderName, todayDate } from "../utils/date.js";

const router = express.Router();

// POST /api/commit/manual -> trigger a manual commit for authenticated user
router.post("/manual", requireAuth, async (req, res) => {
  try {
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ msg: "unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "user not found" });

    if (!user.github || !user.github.accessToken)
      return res.status(400).json({ msg: "GitHub not connected" });

    const octokit = octokitForToken(user.github.accessToken);
    const { owner, repo } = await ensureRepoExists(octokit, user.github.repo || "Fina");

    // find accounts belonging to this user
    let accounts = await Account.find({ createdBy: String(userId) });
    if (!accounts || accounts.length === 0) {
      // fallback: no accounts for user
      accounts = [];
    }

    const folder = dailyFolderName(user.timezone || "Asia/Kolkata");
    const results = [];

    const today = todayDate(user.timezone || "Asia/Kolkata");

    for (const acc of accounts) {
      const txs = await Transaction.find({ accountId: acc._id, date: today }).lean();

      const rows = (txs || []).map((t) => ({
        Date: t.date,
        Description: t.description || "",
        Deposit: Number(t.deposit || 0),
        PenalDeposit: Number(t.penalDeposit || 0),
        OtherDeposit: Number(t.otherDeposit || 0),
        UpLineDeposit: Number(t.upLineDeposit || 0),
        PenalWithdrawal: Number(t.penalWithdrawal || 0),
        OtherWithdrawal: Number(t.otherWithdrawal || 0),
        UpLineWithdrawal: Number(t.upLineWithdrawal || 0),
        CreatedBy: t.createdBy || "",
        UUID: t.uuid || "",
      }));

      // compute totals
      const totals = rows.reduce(
        (acc, r) => {
          acc.Deposit += Number(r.Deposit || 0);
          acc.PenalDeposit += Number(r.PenalDeposit || 0);
          acc.OtherDeposit += Number(r.OtherDeposit || 0);
          acc.UpLineDeposit += Number(r.UpLineDeposit || 0);
          acc.PenalWithdrawal += Number(r.PenalWithdrawal || 0);
          acc.OtherWithdrawal += Number(r.OtherWithdrawal || 0);
          acc.UpLineWithdrawal += Number(r.UpLineWithdrawal || 0);
          return acc;
        },
        { Deposit: 0, PenalDeposit: 0, OtherDeposit: 0, UpLineDeposit: 0, PenalWithdrawal: 0, OtherWithdrawal: 0, UpLineWithdrawal: 0 }
      );

      // append totals row
      rows.push({
        Date: "",
        Description: "Total",
        Deposit: totals.Deposit,
        PenalDeposit: totals.PenalDeposit,
        OtherDeposit: totals.OtherDeposit,
        UpLineDeposit: totals.UpLineDeposit,
        PenalWithdrawal: totals.PenalWithdrawal,
        OtherWithdrawal: totals.OtherWithdrawal,
        UpLineWithdrawal: totals.UpLineWithdrawal,
        CreatedBy: "",
        UUID: "",
      });

      // if no transactions, include opening balance row
      const dataToWrite = rows.length > 1 || (rows.length === 1 && rows[0].Description) ? rows : [{ Account: acc.name, OpeningBalance: acc.openingBalance || 0 }];

      const buffer = generateAccountXLS(acc.name, dataToWrite);
      const path = `${folder}/${acc.name}.xlsx`;
      const message = `Manual daily summary: ${acc.name} (${folder})`;
      await createOrUpdateFile(octokit, owner, repo, path, buffer, message);
      results.push({ path, ok: true, txs: txs.length });
    }

    res.json({ msg: "Manual commit completed", pushed: results.length, details: results });
  } catch (err) {
    console.error("manualCommit error", err && err.message);
    res.status(500).json({ msg: "Manual commit failed", error: err.message || String(err) });
  }
});

// POST /api/commit/undo -> revert last summary (or provided summaryId) for this user
router.post("/undo", requireAuth, async (req, res) => {
  const userId = req.user && req.user.sub;
  if (!userId) return res.status(401).json({ msg: "unauthorized" });

  const { summaryId } = req.body || {};

  try {
    let summary;
    if (summaryId) {
      summary = await Summary.findById(summaryId);
    } else {
      summary = await Summary.findOne({ createdBy: String(userId) }).sort({ createdAt: -1 });
    }

    if (!summary) return res.status(404).json({ error: "Summary not found" });

    // ensure summary belongs to user
    if (summary.createdBy && String(summary.createdBy) !== String(userId)) return res.status(403).json({ error: "Forbidden" });

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // for each account in summary, restore archived transactions and reset opening balance
      for (const pa of summary.perAccount || []) {
        const accId = pa.accountId;
        // find archived transactions
        const hist = await TransactionHistory.find({ summaryRange: summary.date, accountId: accId }).session(session) || [];

        if (hist.length > 0) {
          const toRestore = hist.map((h) => ({
            accountId: h.accountId,
            date: h.date,
            deposit: h.deposit || 0,
            penalDeposit: h.penalDeposit || 0,
            otherDeposit: h.otherDeposit || 0,
            upLineDeposit: h.upLineDeposit || 0,
            penalWithdrawal: h.penalWithdrawal || 0,
            otherWithdrawal: h.otherWithdrawal || 0,
            upLineWithdrawal: h.upLineWithdrawal || 0,
            createdBy: req.user && req.user.sub,
            summaryRange: null,
          }));

          await Transaction.insertMany(toRestore, { session });
          const ids = hist.map((h) => h._id);
          await TransactionHistory.deleteMany({ _id: { $in: ids } }).session(session);
        }

        // revert opening balance
        await Account.findByIdAndUpdate(accId, { openingBalance: pa.openingBefore }, { session });
      }

      // remove summary record
      await Summary.findByIdAndDelete(summary._id, { session });
    });
    session.endSession();

    res.json({ ok: true, msg: 'Summary reverted' });
  } catch (err) {
    console.error('undo summary failed', err && err.message);
    res.status(500).json({ error: err && err.message || String(err) });
  }
});

// POST /api/commit/ciw -> archive today's transactions into history and roll opening balances
router.post("/ciw", requireAuth, async (req, res) => {
  try {
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ msg: "unauthorized" });

    // fetch accounts for this user
    const accounts = await Account.find({ createdBy: String(userId) });
    const timezone = req.user && req.user.timezone;
    const today = todayDate(timezone || "Asia/Kolkata");

    const results = [];
    const perAccount = [];
    let overall = {
      openingTotal: 0,
      deposit: 0,
      penalDeposit: 0,
      otherDeposit: 0,
      upLineDeposit: 0,
      penalWithdrawal: 0,
      otherWithdrawal: 0,
      upLineWithdrawal: 0,
      closingTotal: 0,
    };
    let txCount = 0;
    for (const acc of accounts) {
      const txs = await Transaction.find({ accountId: acc._id, date: today });
      if (!txs || txs.length === 0) {
        results.push({ account: acc.name, archived: 0 });
        continue;
      }

      // compute sums
      let sumDeposits = 0;
      let sumPenalDeposit = 0;
      let sumOtherDeposit = 0;
      let sumUpLineDeposit = 0;
      let sumPenalW = 0;
      let sumOtherW = 0;
      let sumUpLineW = 0;

      for (const t of txs) {
        sumDeposits += Number(t.deposit || 0);
        sumPenalDeposit += Number(t.penalDeposit || 0);
        sumOtherDeposit += Number(t.otherDeposit || 0);
        sumUpLineDeposit += Number(t.upLineDeposit || 0);
        sumPenalW += Number(t.penalWithdrawal || 0);
        sumOtherW += Number(t.otherWithdrawal || 0);
        sumUpLineW += Number(t.upLineWithdrawal || 0);
      }

      // archive each transaction into TransactionHistory
      const historyDocs = txs.map((t) => ({
        originalId: t._id,
        accountId: t.accountId,
        date: t.date,
        deposit: t.deposit || 0,
        otherDeposit: t.otherDeposit || 0,
        upLineDeposit: t.upLineDeposit || 0,
        penalDeposit: t.penalDeposit || 0,
        penalWithdrawal: t.penalWithdrawal || 0,
        otherWithdrawal: t.otherWithdrawal || 0,
        upLineWithdrawal: t.upLineWithdrawal || 0,
        archivedAt: new Date(),
        summaryRange: t.summaryRange || today,
      }));

      await TransactionHistory.insertMany(historyDocs);

      // compute new opening balance: opening + deposits - withdrawals
      const totalDeposits = sumDeposits + sumPenalDeposit + sumOtherDeposit + sumUpLineDeposit;
      const totalWithdrawals = sumPenalW + sumOtherW + sumUpLineW;
      const newOpening = Number(acc.openingBalance || 0) + Number(totalDeposits || 0) - Number(totalWithdrawals || 0);

      // update account opening balance
      acc.openingBalance = newOpening;
      await acc.save();

      // remove original transactions for today
      await Transaction.deleteMany({ accountId: acc._id, date: today });

      results.push({ account: acc.name, archived: txs.length, newOpening });

      // accumulate per-account and overall for summary/audit
      const pa = {
        accountId: String(acc._id),
        accountName: acc.name,
        openingBefore: Number(acc.openingBalance || 0) - (Number(totalDeposits || 0) - Number(totalWithdrawals || 0)),
        txCount: txs.length,
        deposit: sumDeposits,
        penalDeposit: sumPenalDeposit,
        otherDeposit: sumOtherDeposit,
        upLineDeposit: sumUpLineDeposit,
        penalWithdrawal: sumPenalW,
        otherWithdrawal: sumOtherW,
        upLineWithdrawal: sumUpLineW,
        net: Number(totalDeposits || 0) - Number(totalWithdrawals || 0),
        openingAfter: newOpening,
      };

      perAccount.push(pa);
      overall.openingTotal += pa.openingBefore || 0;
      overall.deposit += pa.deposit || 0;
      overall.penalDeposit += pa.penalDeposit || 0;
      overall.otherDeposit += pa.otherDeposit || 0;
      overall.upLineDeposit += pa.upLineDeposit || 0;
      overall.penalWithdrawal += pa.penalWithdrawal || 0;
      overall.otherWithdrawal += pa.otherWithdrawal || 0;
      overall.upLineWithdrawal += pa.upLineWithdrawal || 0;
      overall.closingTotal += pa.openingAfter || 0;
      txCount += txs.length;
    }

    // persist a Summary document so frontend can show audit and allow undo
    try {
      const summaryDoc = new Summary({
        date: today,
        createdBy: String(userId),
        createdAt: new Date().toISOString(),
        perAccount,
        overall,
        txCount,
      });
      await summaryDoc.save();
      res.json({ msg: "CIW summary archived", details: results, summary: summaryDoc });
    } catch (err) {
      console.error("ciw: could not save summary", err && err.message);
      res.json({ msg: "CIW summary archived (partial)", details: results });
    }
  } catch (err) {
    console.error("ciw commit error", err && err.message);
    res.status(500).json({ msg: "CIW commit failed", error: err.message || String(err) });
  }
});

export default router;


