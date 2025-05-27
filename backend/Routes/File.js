import express from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { authenticateUser } from "../middleware/authmiddleware.js";
import { fileModel } from "../models/file.model.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/fileId/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    const file = await fileModel.findOne({ filename });

    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    res.json({ fileId: file._id });
  } catch (error) {
    console.error("Error fetching file ID:", error);
    res.status(500).json({ message: "Server error while fetching file ID." });
  }
});

router.delete("/:filename", authenticateUser, async (req, res) => {
  try {
    const { filename } = req.params;
    const fileDoc = await fileModel.findOne({ filename });

    if (!fileDoc) return res.status(404).send("File not found in DB");

    if (fileDoc.userId.toString() !== req.user._id.toString()) {
      return res.status(403).send("You are not authorized to delete this file");
    }

    await fileModel.deleteOne({ filename });

    const filePath = path.resolve(fileDoc.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).send("File deleted successfully");
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).send("Error deleting file");
  }
});

router.post(
  "/upload",
  authenticateUser,

  upload.array("files"),
  async (req, res) => {
    try {
      const files = req.files;
      let { courses, schools } = req.body;
      if (!Array.isArray(courses)) {
        courses = [courses];
      }
      if (!Array.isArray(schools)) {
        schools = [schools];
      }

      if (!files || files.length === 0) {
        return res.status(400).send("No files uploaded");
      }
      if (
        !courses ||
        !schools ||
        courses.length !== files.length ||
        schools.length !== files.length
      ) {
        return res
          .status(400)
          .send(
            "Courses or schools data is missing or does not match the number of files"
          );
      }

      const savedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { path, filename, originalname } = file;

        const newFile = new fileModel({
          path,
          filename,
          originalname,
          userId: req.user._id,
          course: courses[i],
          school: schools[i],
        });

        await newFile.save();
        savedFiles.push({
          filename,
          originalname,
          course: courses[i],
          school: schools[i],
        });
      }

      console.log(savedFiles);

      res.status(200).json({ message: "Files uploaded", files: savedFiles });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).send("Unable to upload file");
    }
  }
);

router.get("/all", authenticateUser, async (req, res) => {
  try {
    console.log(req.user);
    const userFiles = await fileModel.find({
      userId: new mongoose.Types.ObjectId(req.user._id),
    });

    res.status(200).json(userFiles);
  } catch (error) {
    console.error("Fetch Files Error:", error);
    res.status(500).send("Unable to fetch files");
  }
});

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ message: "Search query missing" });
    }

    const results = await fileModel.find({
      $or: [
        { filename: { $regex: query, $options: "i" } },
        { course: { $regex: query, $options: "i" } },
        { school: { $regex: query, $options: "i" } },
      ],
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
});

router.get("/metadata", async (req, res) => {
  try {
    const files = await fileModel.find({}, "filename course school");
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
});

router.post("/match", async (req, res) => {
  const recommendations = req.body.recommendations;
  console.log("Received recommendations:", recommendations);

  if (!Array.isArray(recommendations))
    return res.status(400).send("Invalid input");

  try {
    const queries = recommendations.map((r) => ({
      course: new RegExp(`^${r.course.trim()}$`, "i"),
      school: new RegExp(`^${r.school.trim()}$`, "i"),
    }));
    console.log("Mongo queries:", queries);

    const files = await fileModel.find({ $or: queries });
    console.log("Matched files:", files);
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.get("/:id/filename", async (req, res) => {
  console.log(req.params.id);
  try {
    const file = await fileModel.findById(req.params.id);
    console.log("Found file:", file);

    if (!file) return res.status(404).json({ message: "File not found" });

    res.json({ filename: file.filename });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/view", async (req, res) => {
  const { id } = req.params;

  try {
    const updatedFile = await fileModel.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json(updatedFile);
  } catch (error) {
    console.error("Error incrementing views:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/save", async (req, res) => {
  const { id } = req.params;

  try {
    const updatedFile = await fileModel.findByIdAndUpdate(
      id,
      { $inc: { saves: 1 } },
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json(updatedFile);
  } catch (error) {
    console.error("Error incrementing saves:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id/unsave", async (req, res) => {
  const { id } = req.params;

  try {
    const updatedFile = await fileModel.findByIdAndUpdate(
      id,
      { $inc: { saves: -1 } },
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({ message: "File not found" });
    }

    // Ensure saves don't go below zero (optional but recommended)
    if (updatedFile.saves < 0) {
      updatedFile.saves = 0;
      await updatedFile.save();
    }

    res.json(updatedFile);
  } catch (error) {
    console.error("Error decrementing saves:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
