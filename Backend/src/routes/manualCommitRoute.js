import express from "express";
import User from "../models/User.js";
import Account from "../models/Account.js";
import { generateAccountExcel } from "../services/excelService.js";
import { pushFileToGitHub } from "../services/githubService.js";
import moment from "moment-timezone";

const router = express.Router();

router.post("/manual-commit", async (req, res) => {
  const userId = req.body.userId;
  const user = await User.findById(userId);

  const accounts = await Account.find({ userId });

  const todayFolder = moment().tz(user.timezone).format("DD-MM-YYYY");

  for (const acc of accounts) {
    const buffer = generateAccountExcel(acc);

    const filePath = `${todayFolder}/${acc.name}.xlsx`;

    await pushFileToGitHub({
      token: user.github.token,
      repo: user.github.repo,
      branch: user.github.branch,
      filePath,
      fileContent: buffer,
      commitMessage: `Manual commit (${acc.name}) - ${todayFolder}`
    });
  }

  res.json({ success: true, message: "Manual commit done!" });
});

export default router;
