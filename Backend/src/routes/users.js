import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Admin-only: list users
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.admin) return res.status(403).json({ error: 'forbidden' });
    const list = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error('users.list error', err && err.message);
    res.status(500).json({ error: 'failed' });
  }
});

// Admin-only: create a user (team member)
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!req.user || !req.user.admin) return res.status(403).json({ error: 'forbidden' });
    const { name, email, role } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'user exists' });
    const pw = Math.random().toString(36).slice(2, 12);
    const hash = await bcrypt.hash(pw, 10);
    const u = new User({ email, name, passwordHash: hash, isAdmin: role === 'Admin' });
    await u.save();
    const out = u.toObject();
    delete out.passwordHash;
    res.json(out);
  } catch (err) {
    console.error('users.create error', err && err.message);
    res.status(500).json({ error: 'failed' });
  }
});

export default router;
