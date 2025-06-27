import { Schema, model, Types } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePictureUrl: { type: String, required: false },
    friends: [{ type: Types.ObjectId, ref: "User" }],

    groupChatReads: [
      {
        groupChatId: { type: Types.ObjectId, ref: "GroupChat" },
        lastReadAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const userModel = model("User", userSchema);
