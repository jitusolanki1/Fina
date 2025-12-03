import express from "express";
import Account from "../models/Account.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, schemas } from "../middleware/validate.js";

const router = express.Router();

// list accounts
router.get("/", requireAuth, async (req, res) => {
  const q = { createdBy: req.user && req.user.sub };
  const list = await Account.find(q).sort({ name: 1 });
  res.json(list);
});

router.get("/:id", requireAuth, async (req, res) => {
  const a = await Account.findById(req.params.id);
  if (a && a.createdBy && String(a.createdBy) !== String(req.user && req.user.sub)) return res.status(403).json({ error: "Forbidden" });
  if (!a) return res.status(404).json({ error: "Not found" });
  res.json(a);
});

router.post("/", requireAuth, validateBody(schemas.accountCreate), async (req, res, next) => {
  try {
    const { name, openingBalance } = req.body;
    const a = new Account({ name, openingBalance: Number(openingBalance || 0), createdBy: req.user && req.user.sub });
    await a.save();
    res.json(a);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const update = req.body;
    const a = await Account.findById(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    if (a.createdBy && String(a.createdBy) !== String(req.user && req.user.sub)) return res.status(403).json({ error: "Forbidden" });
    Object.assign(a, update);
    await a.save();
    res.json(a);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const a = await Account.findById(req.params.id);
  if (a && a.createdBy && String(a.createdBy) !== String(req.user && req.user.sub)) return res.status(403).json({ error: "Forbidden" });
  await Account.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
