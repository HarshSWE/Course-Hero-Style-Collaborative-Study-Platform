import express from "express";
import { authenticateUser } from "../middleware/authmiddleware.js";
import { folderModel } from "../models/folder.model.js";
import { fileModel } from "../models/file.model.js";

const router = express.Router();

// Make folder
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const newFolder = new folderModel({
      user: req.user._id,
      name,
      files: [],
    });

    const savedFolder = await newFolder.save();

    res.status(200).json(savedFolder);
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ message: "Server error while creating folder" });
  }
});

// Save file to folder
router.post("/:folderId/file", authenticateUser, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { fileId } = req.body;
    const userId = req.user._id;

    if (!fileId) {
      return res
        .status(400)
        .json({ message: "fileId is required in the request body" });
    }

    const folder = await folderModel.findById(folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    if (!folder.user.equals(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existingFile = await fileModel.findById(fileId);
    if (!existingFile) {
      return res.status(404).json({ message: "File not found" });
    }

    if (folder.files.includes(existingFile._id)) {
      return res
        .status(400)
        .json({ message: "File already exists in this folder" });
    }

    folder.files.push(existingFile._id);
    await folder.save();

    res
      .status(201)
      .json({ message: "File added to folder", file: existingFile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// get all folders
router.get("/all", authenticateUser, async (req, res) => {
  try {
    const folders = await folderModel
      .find({ user: req.user._id })
      .select("name");
    res.json(folders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// get files from a folder
router.get("/:folderId/files", async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await folderModel.findById(folderId).populate("files");
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.json(folder.files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
