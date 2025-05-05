import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    fileId: { type: Schema.Types.ObjectId, ref: "File", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    content: { type: String, required: true },
    deleted: { type: Boolean, default: false },
    userName: { type: String, required: false },
    profilePictureUrl: { type: String, required: false },
  },
  { timestamps: true }
);

export const commentModel = model("Comment", commentSchema);
