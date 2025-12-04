import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  uuid: { type: String, default: () => uuidv4(), index: true },
  name: { type: String },
  isAdmin: { type: Boolean, default: false },
  github: {
    accessToken: String,
    username: String,
    repo: { type: String, default: "Fina" },
    connectedAt: Date
  },
  timezone: { type: String, default: "Asia/Kolkata" },
  autoCommit: { type: Boolean, default: true },
  commitTime: { type: String, default: "00:00" } 
}, { timestamps: true });

UserSchema.methods.verifyPassword = function (pwd) {
  // Accept either the raw password or the legacy base64-encoded password.
  // Some accounts may have been created with the code that base64-encoded
  // the password before hashing; to remain compatible we try both forms.
  const raw = String(pwd || "");
  const encoded = Buffer.from(raw).toString("base64");
  // try raw first, then encoded
  return bcrypt
    .compare(raw, this.passwordHash)
    .then((ok) => (ok ? true : bcrypt.compare(encoded, this.passwordHash)));
};

export default mongoose.model("User", UserSchema);
