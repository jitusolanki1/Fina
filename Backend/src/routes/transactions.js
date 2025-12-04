import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/transactions?accountId=...&rolled=true&date=2025-12-01
// also support date_gte & date_lte for ranges
router.get("/", requireAuth, async (req, res) => {
  const q = {};
  // filter by accountId when provided
  if (req.query.accountId) {
    // allow either plain id string or mongodb ObjectId
    try {
      q.accountId = mongoose.Types.ObjectId(String(req.query.accountId));
    } catch (e) {
      q.accountId = String(req.query.accountId);
    }
  }

  if (typeof req.query.rolled !== 'undefined') q.rolled = String(req.query.rolled) === 'true';

  // date exact or range support
  if (req.query.date) {
    const d = req.query.date;
    const parts = String(d).split(',');
    if (parts.length === 2) q.date = { $gte: parts[0], $lte: parts[1] };
    else q.date = String(d);
  }
  // support _gte/_lte style used by some helpers
  if (req.query.date_gte || req.query.date_lte) {
    q.date = q.date || {};
    if (req.query.date_gte) q.date.$gte = String(req.query.date_gte);
    if (req.query.date_lte) q.date.$lte = String(req.query.date_lte);
  }

  // scope to authenticated user
  q.createdBy = req.user && req.user.sub;

  const list = await Transaction.find(q).sort({ date: 1 });
  res.json(list);
});

router.post("/", requireAuth, async (req, res) => {
  const body = Object.assign({}, req.body);
  // ensure createdBy is set to the authenticated user
  body.createdBy = req.user && req.user.sub;
  // basic validation: prefer transactions to have an accountId
  if (!body.accountId) {
    // allow creation without accountId but warn in server logs
    console.warn('Creating transaction without accountId by user', body.createdBy);
  }
  const t = new Transaction(body);
  await t.save();
  res.json(t);
});

router.delete("/:id", requireAuth, async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
