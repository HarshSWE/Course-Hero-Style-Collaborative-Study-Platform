import express from "express";
import { authenticateUser } from "../middleware/authmiddleware.js";
import { bookmarkModel } from "../models/bookmark.model.js";

const router = express.Router();

router.post("/:fileId", authenticateUser, async (req, res) => {
  const { fileId } = req.params;
  const userId = req.user._id;

  const existing = await bookmarkModel.findOne({ userId, fileId });

  if (existing) {
    await bookmarkModel.deleteOne({ _id: existing._id });
    res.status(200).json({ message: "Bookmark removed" });
  } else {
    const newBookmark = new bookmarkModel({ userId, fileId });
    await newBookmark.save();
    res.status(201).json({ message: "Bookmark added" });
  }
});

router.get("/all", authenticateUser, async (req, res) => {
  const userId = req.user._id;
  const bookmarks = await bookmarkModel.find({ userId }).populate("fileId");
  const files = bookmarks.map((b) => b.fileId);
  res.status(200).json(files);
});

router.delete("/:fileId", authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const fileId = req.params.fileId;

    console.log("Received unbookmark request");
    console.log("userId:", userId);
    console.log("fileId:", fileId);

    if (!userId) {
      console.log("Unauthorized - userId missing");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deletedBookmark = await bookmarkModel.deleteOne({
      userId: userId,
      fileId: fileId,
    });

    if (deletedBookmark.deletedCount === 0) {
      console.log("Bookmark not found");
      return res.status(404).json({ message: "Bookmark not found" });
    }

    console.log("Successfully unbookmarked file");
    return res.status(200).json({ message: "File unbookmarked successfully" });
  } catch (err) {
    console.error("Error unbookmarking file:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
