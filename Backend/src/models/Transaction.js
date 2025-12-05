import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const TransactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  date: { type: String, default: () => new Date().toISOString().slice(0,10) },
  description: { type: String },
  createdBy: { type: String },
  uuid: { type: String, default: () => uuidv4(), index: true },
  deposit: { type: Number, default: 0 },
  otherDeposit: { type: Number, default: 0 },
  upLineDeposit: { type: Number, default: 0 },
  penalWithdrawal: { type: Number, default: 0 },
  otherWithdrawal: { type: Number, default: 0 },
  upLineWithdrawal: { type: Number, default: 0 },
  rolled: { type: Boolean, default: false },
  summaryRange: { type: String },
}, { timestamps: true });

export default mongoose.model("Transaction", TransactionSchema);
