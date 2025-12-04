import express from "express";
import User from "../models/User.js";
import { octokitForToken, ensureRepoExists, createOrUpdateFile } from "../services/githubService.js";
import { dailyFolderName } from "../utils/date.js";
import { generateAccountXLS } from "../utils/fileGenerator.js";

const router = express.Router();

router.post("/manual-commit", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  const octokit = octokitForToken(user.github.accessToken);
  const { owner, repo } = await ensureRepoExists(octokit, user.github.repo);

  const folder = dailyFolderName(user.timezone);
  const accounts = ["jitu", "mahipal"];

  for (const acc of accounts) {
    const buffer = generateAccountXLS(acc);
    await createOrUpdateFile(
      octokit,
      owner,
      repo,
      `${folder}/${acc}.xlsx`,
      buffer,
      `Manual commit for ${acc}`
    );
  }

  res.json({ msg: "Manual commit completed" });
});

export default router;
