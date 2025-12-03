import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  date: { type: String },
  createdBy: { type: String },
  deposit: { type: Number, default: 0 },
  otherDeposit: { type: Number, default: 0 },
  penalWithdrawal: { type: Number, default: 0 },
  otherWithdrawal: { type: Number, default: 0 },
  rolled: { type: Boolean, default: false },
  summaryRange: { type: String },
}, { timestamps: true });

export default mongoose.model("Transaction", TransactionSchema);
