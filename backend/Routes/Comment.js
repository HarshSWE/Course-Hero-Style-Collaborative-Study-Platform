import express from "express";
import { userModel } from "../models/user.model.js";
import { commentModel } from "../models/comment.model.js";
import { notificationModel } from "../models/notification.model.js";
import { getIO, getUserSockets } from "../sockets/commentSocket.js";
import { authenticateUser } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      fileId,
      userId,
      parentId,
      content,
      username,
      profilePictureUrl,
      netVotes,
    } = req.body;

    console.log(req.body);

    if (!fileId || !userId || !content) {
      return res.status(400).json({
        message: "fileId, userId, and content are required.",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const newComment = await commentModel.create({
      fileId,
      userId,
      parentId: parentId || null,
      content,
      username,
      profilePictureUrl,
      netVotes,
    });

    const io = getIO();
    const userSockets = getUserSockets();

    if (parentId) {
      const parentComment = await commentModel.findById(parentId);
      if (parentComment && parentComment.userId.toString() !== userId) {
        await notificationModel.create({
          commentReference: newComment._id,
          recipient: parentComment.userId,
          sender: user._id,
          senderProfilePictureUrl: user.profilePictureUrl || null,
          file: fileId,
          messageBy: `${username} replied to your comment.`,
          preview: content,
        });

        const recipientSocketId = userSockets[parentComment.userId.toString()];
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("notification", {
            message: `${username} replied to your comment.`,
            preview: content,
            fileId,
          });
        }
      }
    }

    io.emit("receiveComment", {
      _id: newComment._id,
      content: newComment.content,
      parentId: newComment.parentId,
      createdAt: newComment.createdAt,
      fileId: newComment.fileId,
      userId: newComment.userId,
      username: user.name,
      profilePictureUrl: user.profilePictureUrl,
      netVotes: newComment.netVotes,
    });

    res.status(201).json({
      _id: newComment._id,
      content: newComment.content,
      parentId: newComment.parentId,
      createdAt: newComment.createdAt,
      fileId: newComment.fileId,
      userId: newComment.userId,
      username: user.name,
      profilePictureUrl: user.profilePictureUrl,
      netVotes: newComment.netVotes,
    });
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({ message: "Server error while saving comment." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updatedComment = await commentModel.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    );

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json(updatedComment);
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required." });
    }

    const updatedComment = await commentModel.findByIdAndUpdate(
      id,
      { content, parentId: parentId || null },
      { new: true }
    );

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Server error while updating comment." });
  }
});

router.get("/all", async (req, res) => {
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ message: "fileId is required." });
  }

  try {
    const comments = await commentModel.find({ fileId }).sort({ createdAt: 1 });

    if (comments.length === 0) {
      return res
        .status(404)
        .json({ message: "No comments found for this fileId." });
    }

    res.json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/vote", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { voteType } = req.body;
  const userId = req.user._id;

  const value = voteType === "upvote" ? 1 : -1;

  try {
    const comment = await commentModel.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const existingVoteIndex = comment.votes.findIndex(
      (v) => v.userId.toString() === userId.toString()
    );

    if (existingVoteIndex !== -1) {
      if (comment.votes[existingVoteIndex].value === value) {
        comment.votes.splice(existingVoteIndex, 1);
      } else {
        comment.votes[existingVoteIndex].value = value;
      }
    } else {
      comment.votes.push({ userId, value });
    }

    comment.netVotes = comment.votes.reduce((sum, v) => sum + v.value, 0);

    await comment.save();

    res.status(200).json({
      message: "Vote updated",
      netVotes: comment.netVotes,
      votes: comment.votes,
    });
  } catch (err) {
    console.error("Error voting on comment:", err);
    res.status(500).json({ message: "Server error while voting." });
  }
});

export default router;
