import express from "express";
import { notificationModel } from "../models/notification.model.js";
import { authenticateUser } from "../middleware/authmiddleware.js";

const router = express.Router();

// returns count of unread notifications for a particular user
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
  try {
    const notifications = await notificationModel
      .find({ recipient: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
