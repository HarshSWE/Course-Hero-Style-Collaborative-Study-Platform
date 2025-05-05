import express from "express";
import { userModel } from "../models/user.model.js";
import { commentModel } from "../models/comment.model.js";

const router = express.Router();

// Used in CommentSection.tsx
router.post("/", async (req, res) => {
  try {
    const { fileId, userId, parentId, content, userName, profilePictureUrl } =
      req.body;
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
      userName,
      profilePictureUrl,
    });

    res.status(201).json({
      _id: newComment._id,
      content: newComment.content,
      parentId: newComment.parentId,
      createdAt: newComment.createdAt,
      fileId: newComment.fileId,
      userId: newComment.userId,
      userName: user.name,
      profilePictureUrl: user.profilePictureUrl,
    });
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({ message: "Server error while saving comment." });
  }
});

// Used in CommentSection.tsx

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

// Used in CommentSection.tsx

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

// Used in CommentSection.tsx

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

export default router;
