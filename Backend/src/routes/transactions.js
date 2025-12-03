import express from "express";
import Transaction from "../models/Transaction.js";
import { requireAuth } from "../middleware/auth.js";
import decryptDate from "../middleware/decryptDate.js";

const router = express.Router();

// GET /api/transactions?date=2025-12-01&date=2025-12-01&accountId=...&rolled=true
router.get("/", requireAuth, async (req, res) => {
  const q = {};
  if (req.query.accountId) q.accountId = req.query.accountId;
  if (req.query.rolled) q.rolled = req.query.rolled === 'true';
  if (req.query.date) {
    // allow date or date range
    const d = req.query.date;
    // if two dates separated by comma
    const parts = d.split(',');
    if (parts.length === 2) {
      // not implementing range in DB; frontend sometimes passes identical start/end
      q.date = { $gte: parts[0], $lte: parts[1] };
    } else {
      q.date = d;
    }
  }
  // scope to authenticated user
  q.createdBy = req.user && req.user.sub;
  const list = await Transaction.find(q).sort({ date: 1 });
  res.json(list);
});

router.post("/", requireAuth, async (req, res) => {
  // decrypt date if encrypted
  // when using fetch with raw encrypted payload, decryptDate middleware on app level can be used
  const body = Object.assign({}, req.body);
  body.createdBy = req.user && req.user.sub;
  const t = new Transaction(body);
  await t.save();
  res.json(t);
});

router.delete("/:id", requireAuth, async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
