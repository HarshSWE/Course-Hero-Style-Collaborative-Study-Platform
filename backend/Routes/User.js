import express from "express";
import { userModel } from "../models/user.model.js";
import { authenticateUser } from "../middleware/authmiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

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

router.post(
  "/profile-picture",
  authenticateUser,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("Uploaded profile picture:", req.file.path);

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

export default router;
