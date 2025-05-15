import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
  messageBy: { type: String, required: true },
  preview: { type: String }, // <-- add this
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  commentReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    required: false,
  },
});

export const notificationModel = mongoose.model(
  "Notification",
  notificationSchema
);
