import express from "express";
import mongoose from "mongoose";
import { userModel } from "../models/user.model.js";
import { authenticateUser } from "../middleware/authmiddleware.js";
import { notificationModel } from "../models/notification.model.js";
import { getUserStats } from "../utils/statsHelper.js";

import { OpenAI } from "openai";

import upload from "../middleware/upload.js";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//  Get a user's profile picture URL by their user ID.
router.get("/profile-url/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      profilePictureUrl: user.profilePictureUrl || null,
    });
  } catch (err) {
    console.error("Error fetching profile picture:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get the authenticated user's profile picture.
router.get("/profile-picture", authenticateUser, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user || !user.profilePictureUrl) {
      return res.status(404).json({ message: "No profile picture found" });
    }

    res.status(200).json({ profilePictureUrl: user.profilePictureUrl });
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Unable to fetch profile picture" });
  }
});

// Upload and update profile picture for the authenticated user.
router.post(
  "/profile-picture",
  authenticateUser,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      await userModel.findByIdAndUpdate(req.user.id, {
        profilePictureUrl: `http://localhost:5000/uploads/${req.file.filename}`,
      });

      res.status(200).json({
        message: "Profile picture uploaded successfully",
        filePath: `http://localhost:5000/uploads/${req.file.filename}`,
      });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).json({ message: "Unable to upload profile picture" });
    }
  }
);

// Fetch a user's name by their user ID.
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findById(userId).select("name");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ name: user.name });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});
// Generate AI-powered engagement insights for a user based on their recent content statistics and save one as a notification.

router.post("/generate-insight/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const stats = await getUserStats(userId);

    const prompt = `
You are an AI assistant summarizing user engagement stats.

Based on the stats below, generate 2–3 insightful, friendly notifications to the user about how their content is performing. Focus on interesting highlights — like big saves, top comments, trends, or standouts.

Each insight should be returned as a JSON object with:
- "text": the natural language notification text,
- "fileId": if the insight relates to a file (use the _id from the data),
- "commentId": if the insight relates to a comment (use the _id from the data).

Only include "fileId" or "commentId" if it’s directly relevant.

Respond with a JSON array.

Data:
${JSON.stringify(stats, null, 2)}
`;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    // Parse the AI model's response (which is expected to be a JSON string representing an array of insights)
    // into a usable JavaScript array of insight objects
    const insightsArray = JSON.parse(
      aiResponse.choices[0].message.content.trim()
    );

    if (!Array.isArray(insightsArray) || insightsArray.length === 0) {
      return res
        .status(400)
        .json({ message: "AI response did not contain valid insights." });
    }

    // Select the first generated insight from the array for use as a preview notification
    const previewInsight = insightsArray[0];
    const { text, fileId, commentId } = previewInsight;

    if (!text) {
      return res
        .status(400)
        .json({ message: "No valid preview text from AI." });
    }

    const notification = await notificationModel.create({
      recipient: userId,
      file: fileId || undefined,
      commentReference: commentId || undefined,
      messageBy: "AI Assistant",
      preview: text,
      isInsight: true,
    });

    res.json({
      message: "AI-generated insight saved as notification",
      notification,
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ message: "Error generating insights" });
  }
});

// Check if a given friendId is in the user’s friends list.
router.get("/:userId/is-friend/:friendId", async (req, res) => {
  const { userId, friendId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(friendId)
  ) {
    return res.status(400).json({ message: "Invalid user ID or friend ID." });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isFriend = user.friends.includes(friendId);

    return res.status(200).json({ isFriend });
  } catch (error) {
    console.error("Error checking friend status:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// Add two users as friends by their respective IDs, ensures neither ID is invalid or the same user, and prevents duplicate friendships.
router.post("/:recipientId/add-friend/:senderId", async (req, res) => {
  const { recipientId, senderId } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(recipientId) ||
    !mongoose.Types.ObjectId.isValid(senderId)
  ) {
    return res
      .status(400)
      .json({ message: "Invalid recipient ID or sender ID." });
  }

  if (recipientId === senderId) {
    return res
      .status(400)
      .json({ message: "Cannot add yourself as a friend." });
  }

  try {
    const recipient = await userModel.findById(recipientId);
    const sender = await userModel.findById(senderId);

    if (!recipient || !sender) {
      return res
        .status(404)
        .json({ message: "Recipient or Sender not found." });
    }

    if (recipient.friends.includes(senderId)) {
      return res.status(400).json({ message: "Already friends." });
    }

    recipient.friends.push(senderId);
    sender.friends.push(recipientId);

    await recipient.save();
    await sender.save();

    return res
      .status(200)
      .json({ message: "Friend added successfully.", recipient, sender });
  } catch (error) {
    console.error("Error adding friend:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// Get the list of friends for a given user ID.
router.get("/:userId/friends", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel
      .findById(userId)
      .populate("friends", "name email profilePictureUrl");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ friends: user.friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
