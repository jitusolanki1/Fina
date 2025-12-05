import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
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
  // Try to infer an accountId when one is not provided.
  if (!body.accountId) {
    // accept nested `account` object with possible identifiers
    const acctRef = body.account || body.accountRef || null;
    if (acctRef) {
      try {
        // when acctRef is an id-like string
        if (typeof acctRef === 'string') {
          try {
            const maybe = await Account.findById(acctRef);
            if (maybe) body.accountId = String(maybe._id);
          } catch (e) {
            // not an ObjectId, try uuid or name match
            const byUuid = await Account.findOne({ uuid: String(acctRef), createdBy: body.createdBy });
            if (byUuid) body.accountId = String(byUuid._id);
          }
        } else if (typeof acctRef === 'object') {
          if (acctRef._id || acctRef.id) {
            try {
              const maybe = await Account.findById(acctRef._id || acctRef.id);
              if (maybe) body.accountId = String(maybe._id);
            } catch (e) {}
          }
          if (!body.accountId && acctRef.uuid) {
            const byUuid = await Account.findOne({ uuid: String(acctRef.uuid), createdBy: body.createdBy });
            if (byUuid) body.accountId = String(byUuid._id);
          }
          if (!body.accountId && acctRef.name) {
            const byName = await Account.findOne({ name: String(acctRef.name), createdBy: body.createdBy });
            if (byName) body.accountId = String(byName._id);
          }
        }
      } catch (err) {
        console.error('Error while resolving account for transaction create', err && err.message);
      }
    }
  }

  // basic validation: require transactions to have an accountId
  if (!body.accountId) {
    console.warn('Rejected transaction create without accountId by user', body.createdBy);
    return res.status(400).json({ error: 'accountId is required' });
  }

  const t = new Transaction(body);
  await t.save();
  res.json(t);
});

router.delete("/:id", requireAuth, async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// PATCH /api/transactions/:id -> update a transaction (partial)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const patch = Object.assign({}, req.body || {});
    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ error: 'transaction not found' });
    // ensure the authenticated user owns this transaction
    const userId = req.user && req.user.sub;
    if (String(tx.createdBy) !== String(userId)) return res.status(403).json({ error: 'forbidden' });

    // Only allow updating a limited set of fields
    const allowed = ['description','date','deposit','otherDeposit','upLineDeposit','penalWithdrawal','otherWithdrawal','upLineWithdrawal','rolled','accountId'];
    let changed = false;
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) {
        tx[k] = patch[k];
        changed = true;
      }
    }

    if (!changed) return res.status(400).json({ error: 'no updatable fields provided' });

    await tx.save();
    res.json(tx);
  } catch (err) {
    console.error('transactions.patch error', err && err.message);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
