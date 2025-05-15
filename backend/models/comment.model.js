import { Schema, model } from "mongoose";

const voteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    value: { type: Number, enum: [1, -1], required: true },
  },
  { _id: false }
);

const commentSchema = new Schema(
  {
    fileId: { type: Schema.Types.ObjectId, ref: "File", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    content: { type: String, required: true },
    deleted: { type: Boolean, default: false },
    username: { type: String, required: false },
    profilePictureUrl: { type: String, required: false },
    votes: [voteSchema],
    netVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const commentModel = model("Comment", commentSchema);
