import express from "express";
import Summary from "../models/Summary.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const q = { createdBy: req.user && req.user.sub };
  const list = await Summary.find(q).sort({ createdAt: -1 });
  res.json(list);
});

router.get("/:id", requireAuth, async (req, res) => {
  const s = await Summary.findById(req.params.id);
  if (!s) return res.status(404).json({ error: "Not found" });
  if (s.createdBy && String(s.createdBy) !== String(req.user && req.user.sub)) return res.status(403).json({ error: "Forbidden" });
  res.json(s);
});

router.post("/", requireAuth, async (req, res) => {
  const payload = Object.assign({}, req.body, { createdBy: req.user && req.user.sub });
  const s = new Summary(payload);
  await s.save();
  res.json(s);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const s = await Summary.findById(req.params.id);
  if (s && s.createdBy && String(s.createdBy) !== String(req.user && req.user.sub)) return res.status(403).json({ error: "Forbidden" });
  await Summary.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
