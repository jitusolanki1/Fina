import express from "express";
import User from "../models/User.js";
import { octokitForToken, ensureRepoExists } from "../services/githubService.js";

const router = express.Router();

router.post("/update-settings", async (req, res) => {
  const { email, timezone, autoCommit, commitTime } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  user.timezone = timezone || user.timezone;
  user.autoCommit = autoCommit ?? user.autoCommit;
  user.commitTime = commitTime || user.commitTime;

  await user.save();
  res.json({ msg: "Settings updated", user });
});

router.post('/github/pat', async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ msg: 'email and token required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: 'User not found' });

  try {
    const octokit = octokitForToken(token);
    const { data: ghUser } = await octokit.users.getAuthenticated();
    user.github = user.github || {};
    user.github.accessToken = token;
    user.github.username = ghUser.login;
    user.github.repo = user.github.repo || 'Fina';
    user.github.connectedAt = new Date();

    await user.save();

    // ensure repo exists
    await ensureRepoExists(octokit, user.github.repo);

    res.json({ msg: 'GitHub PAT saved and repo ensured', username: ghUser.login, repo: user.github.repo });
  } catch (err) {
    console.error('github.pat error', err && err.message);
    res.status(500).json({ msg: 'Failed to validate token', error: err.message || String(err) });
  }
});

export default router;
