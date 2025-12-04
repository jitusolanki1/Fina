import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { validateBody, schemas } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30PORT";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "Feh6QZpgoAMaKKYHcMDkdOV0PqSlrB4X3LT94Pb2fVxUXJeSJ5hYgpRxy4FkqKB4";

function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), name: user.name, admin: user.isAdmin }, JWT_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: String(user._id) }, REFRESH_SECRET, { expiresIn: '7d' });
}

router.post(
  "/register",
  validateBody(schemas.register),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    // convert password to base64 before hashing (per request)
    const encoded = Buffer.from(String(password)).toString("base64");
    const hash = await bcrypt.hash(encoded, 10);
    const u = new User({ email, passwordHash: hash, name });
    await u.save();
    // auto-login pattern: issue tokens
    const accessToken = signAccessToken(u);
    const refreshToken = signRefreshToken(u);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    };
    // log cookie issuance for debugging (mask token)
    try {
      const sample = String(refreshToken).slice(0, 6) + '...' + String(refreshToken).slice(-6);
      console.log(`Issuing refresh cookie (sample=${sample}) secure=${cookieOptions.secure} sameSite=${cookieOptions.sameSite}`);
    } catch (e) {}
    res.cookie("refreshToken", refreshToken, cookieOptions);
    // in non-production include refresh token in body as a fallback for clients
    const responseBody = { token: accessToken, user: { id: u._id, email: u.email, name: u.name } };
    if (process.env.NODE_ENV !== 'production') responseBody.refreshToken = refreshToken;
    res.json(responseBody);
  })
);

router.post(
  "/login",
  validateBody(schemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ error: "invalid credentials" });
    // base64-encode incoming password to match register behaviour
    const encoded = Buffer.from(String(password)).toString("base64");
    const ok = await u.verifyPassword(encoded);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    const accessToken = signAccessToken(u);
    const refreshToken = signRefreshToken(u);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    };
    try {
      const sample = String(refreshToken).slice(0, 6) + '...' + String(refreshToken).slice(-6);
      console.log(`Issuing refresh cookie (sample=${sample}) secure=${cookieOptions.secure} sameSite=${cookieOptions.sameSite}`);
    } catch (e) {}
    res.cookie("refreshToken", refreshToken, cookieOptions);
    const responseBody = { token: accessToken, user: { id: u._id, email: u.email, name: u.name } };
    if (process.env.NODE_ENV !== 'production') responseBody.refreshToken = refreshToken;
    res.json(responseBody);
  })
);

// POST /api/auth/refresh -> uses httpOnly cookie
router.post("/refresh", async (req, res) => {
  // accept refresh token from cookie, body, or header for robustness
  let token = req.cookies && req.cookies.refreshToken;
  if (!token && req.body && req.body.refreshToken) token = req.body.refreshToken;
  if (!token && req.headers && req.headers['x-refresh-token']) token = req.headers['x-refresh-token'];
  // also accept Bearer in Authorization as a fallback
  if (!token && req.headers && req.headers.authorization) {
    const m = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
    if (m) token = m[1];
  }
  // logging which source provided the token (for debugging)
  try {
    const sources = { cookie: Boolean(req.cookies && req.cookies.refreshToken), body: Boolean(req.body && req.body.refreshToken), header: Boolean(req.headers && (req.headers['x-refresh-token'] || req.headers.authorization)) };
    console.log('Refresh attempt - token sources:', sources);
  } catch (e) {}
  if (!token) return res.status(401).json({ error: "missing refresh token" });
  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "invalid refresh token" });
    const accessToken = signAccessToken(user);
    res.json({ token: accessToken, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    return res.status(401).json({ error: "invalid refresh token" });
  }
});

router.post("/logout", (req, res) => {
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/' };
  res.clearCookie("refreshToken", cookieOptions);
  res.json({ ok: true });
});

export default router;

// Developer-only debug endpoint: tells whether a refresh token was observed
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug', (req, res) => {
    const fromCookie = Boolean(req.cookies && req.cookies.refreshToken);
    const fromBody = Boolean(req.body && req.body.refreshToken);
    const fromHeader = Boolean(req.headers && (req.headers['x-refresh-token'] || req.headers.authorization));
    // do not echo the token value; mask it if present
    function mask(s) {
      if (!s) return null;
      const str = String(s);
      if (str.length <= 8) return '****';
      return str.slice(0, 4) + '...' + str.slice(-4);
    }
    res.json({
      seen: { cookie: fromCookie, body: fromBody, header: fromHeader },
      cookieValueSample: mask(req.cookies && req.cookies.refreshToken),
      headerValueSample: mask(req.headers && (req.headers['x-refresh-token'] || req.headers.authorization)),
    });
  });
}
