import express from "express";
import TransactionHistory from "../models/TransactionHistory.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const q = {};
  if (req.query.accountId) q.accountId = req.query.accountId;
  if (req.query.summaryRange) q.summaryRange = req.query.summaryRange;
  const list = await TransactionHistory.find(q).sort({ archivedAt: -1 });
  res.json(list);
});

router.post("/", requireAuth, async (req, res) => {
  const h = new TransactionHistory(req.body);
  await h.save();
  res.json(h);
});

router.delete("/:id", requireAuth, async (req, res) => {
  await TransactionHistory.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
