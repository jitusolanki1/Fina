import express from "express";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, schemas } from "../middleware/validate.js";

const router = express.Router();

// list accounts
router.get("/", requireAuth, async (req, res) => {
  const q = { createdBy: req.user && req.user.sub };
  const list = await Account.find(q).sort({ name: 1 });
  // sanitize accounts: expose a single `id` and do not include openingBalance
  const out = list.map((a) => ({
    id: String(a._id),
    name: a.name,
    createdBy: a.createdBy,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
  res.json(out);
});

router.get("/:id", requireAuth, async (req, res) => {
  const a = await Account.findById(req.params.id);
  if (a && a.createdBy && String(a.createdBy) !== String(req.user && req.user.sub)) return res.status(403).json({ error: "Forbidden" });
  if (!a) return res.status(404).json({ error: "Not found" });
  res.json({ id: String(a._id), name: a.name, createdBy: a.createdBy, createdAt: a.createdAt, updatedAt: a.updatedAt });
});

router.post("/", requireAuth, validateBody(schemas.accountCreate), async (req, res, next) => {
  try {
    const { name, openingBalance } = req.body;
    const a = new Account({ name, openingBalance: Number(openingBalance || 0), createdBy: req.user && req.user.sub });
    await a.save();
    // If there's an opening balance, record it as an immutable opening transaction
    try {
      const ob = Number(openingBalance || 0);
      if (ob !== 0) {
        const tx = new Transaction({
          accountId: String(a._id),
          date: (new Date(a.createdAt)).toISOString().slice(0,10),
          description: "Opening balance",
          createdBy: req.user && req.user.sub,
          immutable: true,
        });
        if (ob >= 0) tx.deposit = ob;
        else tx.otherWithdrawal = Math.abs(ob);
        await tx.save();
      }
    } catch (err) {
      console.error("Could not create opening transaction", err && err.message);
    }
    // Do not return openingBalance in the account response; return a single id
    res.json({ id: String(a._id), name: a.name, createdBy: a.createdBy, createdAt: a.createdAt, updatedAt: a.updatedAt });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const update = req.body;
    // Prevent changing openingBalance after creation — opening balance becomes an opening transaction
    if (Object.prototype.hasOwnProperty.call(update, "openingBalance")) delete update.openingBalance;
    const a = await Account.findById(req.params.id);
    if (!a) return res.status(404).json({ error: "Not found" });
    if (a.createdBy && String(a.createdBy) !== String(req.user && req.user.sub)) return res.status(403).json({ error: "Forbidden" });
    Object.assign(a, update);
    await a.save();
    res.json({ id: String(a._id), name: a.name, createdBy: a.createdBy, createdAt: a.createdAt, updatedAt: a.updatedAt });
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
