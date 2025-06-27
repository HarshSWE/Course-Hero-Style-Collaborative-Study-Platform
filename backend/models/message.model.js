import { Schema, model, Types } from "mongoose";

const messageSchema = new Schema(
  {
    groupId: {
      type: Types.ObjectId,
      ref: "GroupChat",
      required: true,
    },
    senderId: {
      type: Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type === "text";
      },
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    profilePictureUrl: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["text", "system", "file"],
      default: "text",
    },
    files: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const messageModel = model("Message", messageSchema);
