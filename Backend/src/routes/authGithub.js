import express from "express";
import axios from "axios";
import User from "../models/User.js";
import {
  octokitForToken,
  ensureRepoExists,
} from "../services/githubService.js";

const router = express.Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK = process.env.GITHUB_OAUTH_CALLBACK;

// 1) Redirect user to GitHub to authorize
router.get("/connect", (req, res) => {
  // Allow frontend to pass a linkState (e.g. containing the user's auth token)
  // so the callback can link the GitHub account to the currently logged-in user.
  const state = req.query && req.query.linkState ? req.query.linkState : generateStateForUser(req); // optional CSRF state
  const scopes = ["repo", "read:user", "user:email"];

  // Guard against misconfiguration: don't redirect to GitHub with undefined params
  if (!CLIENT_ID || !CALLBACK) {
    console.error(
      "GitHub OAuth connect attempted but GITHUB_CLIENT_ID or GITHUB_OAUTH_CALLBACK is not set."
    );
    // Prefer redirecting back to frontend settings with an error flag if FRONTEND_URL is configured
    const frontendUrl = process.env.FRONTEND_URL || null;
    if (frontendUrl) {
      return res.redirect(
        `${frontendUrl.replace(/\/$/, "")}/settings?github_setup=missing_env`
      );
    }
    return res
      .status(500)
      .send(
        `GitHub OAuth is not configured on the server. Please set GITHUB_CLIENT_ID and GITHUB_OAUTH_CALLBACK environment variables.`
      );
  }

  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    CALLBACK
  )}&scope=${encodeURIComponent(scopes.join(" "))}&state=${state}`;
  res.redirect(url);
});

// 2) Callback: exchange code for access_token
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("Code missing");

    // Exchange code for access token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK,
        state,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes?.data?.access_token;
    if (!accessToken) {
      console.error("GitHub token exchange failed", tokenRes?.data);
      return res.status(500).send("No access token returned");
    }

    // Get user info
    const octokit = octokitForToken(accessToken);
    const { data: ghUser } = await octokit.users.getAuthenticated();

    // If the GitHub redirect state contained a `userToken`, we will try to verify
    // that token and attach this GitHub account to the logged-in user. This ensures
    // manual commit actions will run under the correct user.
    let user = null;
    try {
      if (state && String(state).startsWith("userToken:")) {
        // state was encoded by the frontend as `userToken:<encoded-jwt>`
        const raw = String(state).slice("userToken:".length);
        const jwtToken = decodeURIComponent(raw);
        // verify token to extract user id
        const jwt = await import("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET;
        try {
          const payload = jwt.verify(jwtToken, JWT_SECRET);
          if (payload && payload.sub) {
            // Attach github info to this existing user id
            const filter = { _id: payload.sub };
            const update = {
              $set: {
                "github.username": ghUser.login,
                "github.accessToken": accessToken,
                "github.connectedAt": new Date(),
                "github.repo": "Fina",
                name: ghUser.name || ghUser.login,
              },
            };
            if (ghUser.email) update.$set.email = ghUser.email;
            const opts = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: false };
            user = await User.findOneAndUpdate(filter, update, opts);
          }
        } catch (e) {
          console.error('Failed to verify user token in OAuth state', e && e.message);
        }
      }

      // If we didn't find a user via the state token above, fallback to upsert by github username
      if (!user) {
        const filter = { "github.username": ghUser.login };
        const update = {
          $set: {
            "github.username": ghUser.login,
            "github.accessToken": accessToken,
            "github.connectedAt": new Date(),
            "github.repo": "Fina",
            name: ghUser.name || ghUser.login,
          },
        };
        if (ghUser.email) update.$set.email = ghUser.email;
        const opts = { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: false };
        user = await User.findOneAndUpdate(filter, update, opts);
      }
    } catch (e) {
      console.error('Failed to persist GitHub user', e && e.message);
      throw e;
    }

    // Ensure repo exists (best-effort)
    try {
      await ensureRepoExists(octokit, user.github.repo);
    } catch (e) {
      console.error("ensureRepoExists failed", e);
    }

    // Redirect back to frontend (if configured) or send a success page
    const frontendRoot = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    if (frontendRoot)
      return res.redirect(`${frontendRoot}/?github_connected=1`);
    return res.send("GitHub connected successfully");
  } catch (err) {
    console.error("GitHub callback error", err);
    return res
      .status(500)
      .send("GitHub callback failed: " + (err.message || "unknown error"));
  }
});

function generateStateForUser(req) {
  // Implement CSRF state generation and storage (session / db)
  return "random-state-123";
}

export default router;
