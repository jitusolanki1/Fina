import express from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import Account from "../models/Account.js";
import { octokitForToken, ensureRepoExists, createOrUpdateFile } from "../services/githubService.js";
import { generateAccountXLS } from "../utils/fileGenerator.js";
import { dailyFolderName } from "../utils/date.js";

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

    for (const acc of accounts) {
      // generate a simple excel buffer for the account
      const buffer = generateAccountXLS(acc.name, [
        { Account: acc.name, OpeningBalance: acc.openingBalance || 0 },
      ]);

      const path = `${folder}/${acc.name}.xlsx`;
      const message = `Manual daily summary: ${acc.name} (${folder})`;
      await createOrUpdateFile(octokit, owner, repo, path, buffer, message);
      results.push({ path, ok: true });
    }

    res.json({ msg: "Manual commit completed", pushed: results.length, details: results });
  } catch (err) {
    console.error("manualCommit error", err && err.message);
    res.status(500).json({ msg: "Manual commit failed", error: err.message || String(err) });
  }
});

export default router;
