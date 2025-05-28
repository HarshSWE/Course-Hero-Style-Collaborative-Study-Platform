import express from "express";
import { notificationModel } from "../models/notification.model.js";
import { authenticateUser } from "../middleware/authmiddleware.js";

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
      .find({ recipient: req.user.id, isRead: false })
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
      })
      .sort({ createdAt: -1 });

    res.json(insights);
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

export default router;
