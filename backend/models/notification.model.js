import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  senderProfilePictureUrl: {
    type: String,
    required: false,
  },
  file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: false },
  messageBy: { type: String, required: true },
  preview: { type: String },
  isRead: { type: Boolean, default: false },
  isInsight: { type: Boolean, default: false },
  isFriendRequest: {
    type: Boolean,
    default: false,
  },
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
