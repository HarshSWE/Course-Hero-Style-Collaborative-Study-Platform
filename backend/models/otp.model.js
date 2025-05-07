import { Schema, model } from "mongoose";

const otpSchema = new Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 1800 }, // auto-delete in 30 min
});

export default model("Otp", otpSchema);
