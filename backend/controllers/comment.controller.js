import { commentModel } from "../models/comment.model.js";
import { notificationModel } from "../models/notification.model.js";
import { userModel } from "../models/user.model.js";

export const createComment = async (req, res) => {
  try {
    const { fileId, userId, content, userName, parentId, profilePictureUrl } =
      req.body;

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

    const commenters = await commentModel
      .find({ fileId })
      .distinct("userId")
      .where("userId")
      .ne(userId);

    await Promise.all(
      commenters.map(async (recipientId) => {
        await notificationModel.create({
          recipient: recipientId,
          file: fileId,
          message: `${user.name} commented on a file you’re following.`,
        });
      })
    );

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
    console.error("Error saving comment and sending notifications:", error);
    res.status(500).json({ message: "Server error while saving comment." });
  }
};
