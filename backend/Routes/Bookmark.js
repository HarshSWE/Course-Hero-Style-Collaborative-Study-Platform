import express from "express";
import { authenticateUser } from "../middleware/authmiddleware.js";
import { bookmarkModel } from "../models/bookmark.model.js";
import { fileModel } from "../models/file.model.js";

const router = express.Router();

// Add a bookmark for a specific file for the authenticated user and increments the file's 'saves' count by 1

router.post("/:fileId", authenticateUser, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user._id;

    const newBookmark = new bookmarkModel({ userId, fileId });
    await newBookmark.save();

    const updatedFile = await fileModel.findByIdAndUpdate(
      fileId,
      { $inc: { saves: 1 } },
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({ message: "File not found" });
    }

    res.status(201).json({ message: "Bookmark added", file: updatedFile });
  } catch (err) {
    console.error("Error adding bookmark and incrementing saves:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Retrieves all files bookmarked by the authenticated user
router.get("/all", authenticateUser, async (req, res) => {
  const userId = req.user._id;

  const bookmarks = await bookmarkModel.find({ userId }).populate("fileId");

  const files = bookmarks.filter((b) => b.fileId).map((b) => b.fileId);

  res.status(200).json(files);
});

// Removes a bookmark for a specific file for the authenticated user and decrements the file's 'saves' count by 1
router.delete("/:fileId", authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const fileId = req.params.fileId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deletedBookmark = await bookmarkModel.deleteOne({ userId, fileId });

    if (deletedBookmark.deletedCount === 0) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    let updatedFile = await fileModel.findByIdAndUpdate(
      fileId,
      { $inc: { saves: -1 } },
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({ message: "File not found" });
    }

    if (updatedFile.saves < 0) {
      updatedFile.saves = 0;
      await updatedFile.save();
    }

    res.status(200).json({ message: "Bookmark removed", file: updatedFile });
  } catch (err) {
    console.error("Error unbookmarking file and decrementing saves:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
