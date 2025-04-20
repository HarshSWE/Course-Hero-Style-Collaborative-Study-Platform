import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
});

export const bookmarkModel = mongoose.model("Bookmark", bookmarkSchema);
