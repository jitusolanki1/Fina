import express from "express";
import axios from "axios";
import User from "../models/User.js";
import { octokitForToken, ensureRepoExists } from "../services/githubService.js";

const router = express.Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK = process.env.GITHUB_OAUTH_CALLBACK;

// 1) Redirect user to GitHub to authorize
router.get("/connect", (req, res) => {
  const state = generateStateForUser(req); // optional CSRF state
  const scopes = ["repo", "read:user", "user:email"];

  // Guard against misconfiguration: don't redirect to GitHub with undefined params
  if (!CLIENT_ID || !CALLBACK) {
    console.error('GitHub OAuth connect attempted but GITHUB_CLIENT_ID or GITHUB_OAUTH_CALLBACK is not set.');
    // Prefer redirecting back to frontend settings with an error flag if FRONTEND_URL is configured
    const frontendUrl = process.env.FRONTEND_URL || null;
    if (frontendUrl) {
      return res.redirect(`${frontendUrl.replace(/\/$/, '')}/settings?github_setup=missing_env`);
    }
    return res.status(500).send(`GitHub OAuth is not configured on the server. Please set GITHUB_CLIENT_ID and GITHUB_OAUTH_CALLBACK environment variables.`);
  }

  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK)}&scope=${encodeURIComponent(scopes.join(" "))}&state=${state}`;
  res.redirect(url);
});

// 2) Callback: exchange code for access_token
router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send("Code missing");

  // Exchange code
  const tokenRes = await axios.post("https://github.com/login/oauth/access_token", {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: CALLBACK,
    state
  }, { headers: { Accept: "application/json" } });

  const accessToken = tokenRes.data.access_token;
  if (!accessToken) return res.status(400).send("No access token returned");

  // Get user info
  const octokit = octokitForToken(accessToken);
  const { data: ghUser } = await octokit.users.getAuthenticated();

  // Persistence: find or create our user by email or github id
  // (Assuming you have currently logged-in session or create a new user)
  // For demo, create/find by ghUser.login
  let user = await User.findOne({ "github.username": ghUser.login });
  if (!user) {
    user = new User({
      name: ghUser.name || ghUser.login,
      email: ghUser.email || null,
      github: { username: ghUser.login, accessToken, connectedAt: new Date() }
    });
  } else {
    user.github.accessToken = accessToken;
    user.github.connectedAt = new Date();
  }

  // Save repo name preference
  user.github.repo = "Fina";

  await user.save();

  // Ensure repo exists
  await ensureRepoExists(octokit, user.github.repo);

  // Redirect to app (show success)
  res.redirect("/app?github_connected=1");
});

function generateStateForUser(req) {
  // Implement CSRF state generation and storage (session / db)
  return "random-state-123";
}

export default router;
