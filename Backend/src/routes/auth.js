import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { validateBody, schemas } from "../middleware/validate.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), name: user.name, admin: user.isAdmin }, JWT_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: String(user._id) }, REFRESH_SECRET, { expiresIn: '7d' });
}

router.post("/register", validateBody(schemas.register), async (req, res, next) => {
  const { email, password, name } = req.body;
  try {
    // convert password to base64 before hashing (per request)
    const encoded = Buffer.from(String(password)).toString("base64");
    const hash = await bcrypt.hash(encoded, 10);
    const u = new User({ email, passwordHash: hash, name });
    await u.save();
    // auto-login pattern: issue tokens
    const accessToken = signAccessToken(u);
    const refreshToken = signRefreshToken(u);
    res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ token: accessToken, user: { id: u._id, email: u.email, name: u.name } });
  } catch (err) {
    next(err);
  }
});

router.post("/login", validateBody(schemas.login), async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ error: "invalid credentials" });
    // base64-encode incoming password to match register behaviour
    const encoded = Buffer.from(String(password)).toString("base64");
    const ok = await u.verifyPassword(encoded);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    const accessToken = signAccessToken(u);
    const refreshToken = signRefreshToken(u);
    res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ token: accessToken, user: { id: u._id, email: u.email, name: u.name } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh -> uses httpOnly cookie
router.post("/refresh", async (req, res) => {
  const token = req.cookies && req.cookies.refreshToken;
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
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ ok: true });
});

export default router;
