import mongoose from "mongoose";

const PerAccountSchema = new mongoose.Schema({
  accountId: String,
  accountName: String,
  openingBefore: Number,
  txCount: Number,
  deposit: Number,
  otherDeposit: Number,
  penalWithdrawal: Number,
  otherWithdrawal: Number,
  net: Number,
  openingAfter: Number,
}, { _id: false });

const SummarySchema = new mongoose.Schema({
  date: { type: String },
  createdBy: { type: String },
  createdAt: { type: String },
  perAccount: [PerAccountSchema],
  overall: { type: Object },
  txCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Summary", SummarySchema);
