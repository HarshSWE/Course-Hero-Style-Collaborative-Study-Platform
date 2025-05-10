import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // The user who will receive the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const notificationModel = mongoose.model(
  "Notification",
  notificationSchema
);
