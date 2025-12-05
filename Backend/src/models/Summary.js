import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const PerAccountSchema = new mongoose.Schema({
  accountId: String,
  accountName: String,
  openingBefore: Number,
  txCount: Number,
  deposit: Number,
  penalDeposit: Number,
  otherDeposit: Number,
  upLineDeposit: Number,
  penalWithdrawal: Number,
  otherWithdrawal: Number,
  upLineWithdrawal: Number,
  net: Number,
  openingAfter: Number,
}, { _id: false });

const SummarySchema = new mongoose.Schema({
  date: { type: String },
  createdBy: { type: String },
  uuid: { type: String, default: () => uuidv4(), index: true },
  createdAt: { type: String },
  perAccount: [PerAccountSchema],
  overall: { type: Object },
  txCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Summary", SummarySchema);
