import { Schema, model } from "mongoose";

const fileSchema = new Schema({
  path: { type: String, required: true },
  filename: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: String, required: false }, // optional
  school: { type: String, required: false }, // optional
});

export const fileModel = model("File", fileSchema);
