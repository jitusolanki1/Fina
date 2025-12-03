import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  uuid: { type: String, default: () => uuidv4(), index: true },
  name: { type: String },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

UserSchema.methods.verifyPassword = function (pwd) {
  return bcrypt.compare(pwd, this.passwordHash);
};

export default mongoose.model("User", UserSchema);
