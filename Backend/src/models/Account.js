import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const AccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  openingBalance: { type: Number, default: 0 },
  createdBy: { type: String },
  uuid: { type: String, default: () => uuidv4(), index: true },
}, { timestamps: true });

export default mongoose.model("Account", AccountSchema);
