import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  openingBalance: { type: Number, default: 0 },
  createdBy: { type: String },
}, { timestamps: true });

export default mongoose.model("Account", AccountSchema);
