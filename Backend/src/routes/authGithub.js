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

router.get("/connect", (req, res) => {
  const state =
    req.query && req.query.linkState
      ? req.query.linkState
      : generateStateForUser(req);
  const scopes = ["repo", "read:user", "user:email"];

  if (!CLIENT_ID || !CALLBACK) {
    console.error(
      "GitHub OAuth connect attempted but GITHUB_CLIENT_ID or GITHUB_OAUTH_CALLBACK is not set."
    );
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

router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("Code missing");

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

    const octokit = octokitForToken(accessToken);
    const { data: ghUser } = await octokit.users.getAuthenticated();

    let user = null;
    try {
      if (state && String(state).startsWith("userToken:")) {
        const raw = String(state).slice("userToken:".length);
        const jwtToken = decodeURIComponent(raw);
        const jwt = await import("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET;
        try {
          const payload = jwt.verify(jwtToken, JWT_SECRET);
          if (payload && payload.sub) {
            const filter = { _id: payload.sub };
            const update = {
              $set: {
                "github.username": ghUser.login,
                "github.accessToken": accessToken,
                "github.avatarUrl": ghUser.avatar_url,
                "github.connectedAt": new Date(),
                "github.repo": "Fina",
                name: ghUser.name || ghUser.login,
              },
            };
            if (ghUser.email) update.$set.email = ghUser.email;
            const opts = {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
              runValidators: false,
            };
            user = await User.findOneAndUpdate(filter, update, opts);
          }
        } catch (e) {
          console.error(
            "Failed to verify user token in OAuth state",
            e && e.message
          );
          try {
            const decoded = jwt.decode(jwtToken);
            if (decoded && decoded.sub) {
              const filter = { _id: decoded.sub };
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
              const opts = {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
                runValidators: false,
              };
              user = await User.findOneAndUpdate(filter, update, opts);
              console.warn(
                "Linked GitHub using decode-only fallback (token may have been expired)"
              );
            }
          } catch (e2) {
            console.error("Decode fallback failed", e2 && e2.message);
          }
        }
      }

      if (!user) {
        const filter = { "github.username": ghUser.login };
        const update = {
          $set: {
            "github.username": ghUser.login,
            "github.accessToken": accessToken,
            "github.avatarUrl": ghUser.avatar_url,
            "github.connectedAt": new Date(),
            "github.repo": "Fina",
            name: ghUser.name || ghUser.login,
          },
        };
        if (ghUser.email) update.$set.email = ghUser.email;
        const opts = {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: false,
        };
        user = await User.findOneAndUpdate(filter, update, opts);
      }
    } catch (e) {
      console.error("Failed to persist GitHub user", e && e.message);
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
    ṇ;
    console.error("GitHub callback error", err);
    return res
      .status(500)
      .send("GitHub callback failed: " + (err.message || "unknown error"));
  }
});

function generateStateForUser(req) {
  return "random-state-123";
}

export default router;
