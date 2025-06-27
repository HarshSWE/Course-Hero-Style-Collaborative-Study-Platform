import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
    ],
    groupPictureUrl: {
      type: String,
      default: "",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

groupChatSchema.pre("save", function (next) {
  this.lastUpdated = Date.now();
  next();
});

const GroupChat = mongoose.model("GroupChat", groupChatSchema);

export default GroupChat;
