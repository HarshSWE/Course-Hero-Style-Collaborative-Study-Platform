import express from "express";
import mongoose from "mongoose";
import { notificationModel } from "../models/notification.model.js";
import { authenticateUser } from "../middleware/authmiddleware.js";
import { userModel } from "../models/user.model.js";

const router = express.Router();

router.get("/count", authenticateUser, async (req, res) => {
  try {
    const count = await notificationModel.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", authenticateUser, async (req, res) => {
  console.log("Authenticated User:", req.user);
  try {
    const notifications = await notificationModel
      .find({
        recipient: req.user.id,
        isRead: false,
        isInsight: false,
        isFriendRequest: false,
      })
      .sort({ createdAt: -1 });

    console.log(notifications);
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/mark-as-read/:id", async (req, res) => {
  try {
    const notifId = req.params.id;
    console.log(notifId);
    await notificationModel.findByIdAndUpdate(notifId, { isRead: true });
    res.status(200).json({ message: "Notification marked as read." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification as read." });
  }
});

router.get("/insights/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const insights = await notificationModel
      .find({
        recipient: userId,
        isInsight: true,
        isRead: false,
      })
      .sort({ createdAt: -1 });

    res.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

router.post("/friend-request", authenticateUser, async (req, res) => {
  try {
    const { recipientId, messageBy } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !messageBy) {
      return res
        .status(400)
        .json({ error: "Recipient ID and messageBy are required." });
    }

    const existingRequest = await notificationModel.findOne({
      recipient: recipientId,
      sender: senderId,
      isFriendRequest: true,
      isRead: false,
    });

    if (existingRequest) {
      return res.status(400).json({
        error: "A pending friend request has already been sent to this user.",
      });
    }

    const senderUser = await userModel.findById(senderId);
    if (!senderUser) {
      return res.status(404).json({ error: "Sender user not found." });
    }

    const newNotification = new notificationModel({
      recipient: recipientId,
      sender: senderId,
      senderProfilePictureUrl: senderUser.profilePictureUrl || null,
      messageBy,
      isFriendRequest: true,
      isRead: false,
      preview: `${messageBy} sent you a friend request.`,
    });

    await newNotification.save();

    res.status(201).json({
      message: "Friend request notification created.",
      notification: newNotification,
    });
  } catch (err) {
    console.error("Error creating friend request notification:", err);
    res
      .status(500)
      .json({ error: "Failed to create friend request notification." });
  }
});

router.get("/friend-requests", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const friendRequests = await notificationModel
      .find({ recipient: userId, isFriendRequest: true, isRead: false })
      .sort({ createdAt: -1 });

    res.status(200).json({ friendRequests });
  } catch (err) {
    console.error("Error fetching friend request notifications:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch friend request notifications." });
  }
});

router.get("/check-friend-request/:senderId/:recipientId", async (req, res) => {
  const { senderId, recipientId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(senderId) ||
    !mongoose.Types.ObjectId.isValid(recipientId)
  ) {
    return res.status(400).json({ message: "Invalid user IDs provided." });
  }

  try {
    const existingRequest = await notificationModel.findOne({
      sender: senderId,
      recipient: recipientId,
      isFriendRequest: true,
    });

    if (existingRequest) {
      return res.json({ exists: true, request: existingRequest });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking friend request:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
