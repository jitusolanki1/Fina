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
      maxAge: 7 * 24 * 3600 * 1000,
    };
    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({ token: accessToken, user: { id: u._id, email: u.email, name: u.name } });
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
      maxAge: 7 * 24 * 3600 * 1000,
    };
    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.json({ token: accessToken, user: { id: u._id, email: u.email, name: u.name } });
  })
);

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
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' };
  res.clearCookie("refreshToken", cookieOptions);
  res.json({ ok: true });
});

export default router;
