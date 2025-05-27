import { Schema, model } from "mongoose";

const fileSchema = new Schema({
  path: { type: String, required: true },
  filename: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: String, required: true },
  school: { type: String, required: true },
  views: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
});

export const fileModel = model("File", fileSchema);
