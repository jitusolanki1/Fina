import express from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import Account from "../models/Account.js";
import { octokitForToken, ensureRepoExists, createOrUpdateFile } from "../services/githubService.js";
import { generateAccountXLS } from "../utils/fileGenerator.js";
import Transaction from "../models/Transaction.js";
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
          acc.OtherDeposit += Number(r.OtherDeposit || 0);
          acc.UpLineDeposit += Number(r.UpLineDeposit || 0);
          acc.PenalWithdrawal += Number(r.PenalWithdrawal || 0);
          acc.OtherWithdrawal += Number(r.OtherWithdrawal || 0);
          acc.UpLineWithdrawal += Number(r.UpLineWithdrawal || 0);
          return acc;
        },
        { Deposit: 0, OtherDeposit: 0, UpLineDeposit: 0, PenalWithdrawal: 0, OtherWithdrawal: 0, UpLineWithdrawal: 0 }
      );

      // append totals row
      rows.push({
        Date: "",
        Description: "Total",
        Deposit: totals.Deposit,
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

export default router;
