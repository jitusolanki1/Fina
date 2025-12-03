import mongoose from "mongoose";

const TransactionHistorySchema = new mongoose.Schema({
  originalId: { type: mongoose.Schema.Types.ObjectId },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  date: { type: String },
  deposit: { type: Number, default: 0 },
  otherDeposit: { type: Number, default: 0 },
  penalWithdrawal: { type: Number, default: 0 },
  otherWithdrawal: { type: Number, default: 0 },
  archivedAt: { type: Date },
  summaryRange: { type: String },
}, { timestamps: true });

export default mongoose.model("TransactionHistory", TransactionHistorySchema);
