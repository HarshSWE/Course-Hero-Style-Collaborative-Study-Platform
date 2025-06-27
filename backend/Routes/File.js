import express from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { authenticateUser } from "../middleware/authmiddleware.js";
import { fileModel } from "../models/file.model.js";
import upload from "../middleware/upload.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Retrieve the MongoDB _id of a file by its filename
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

// Delete a file record and physical file from disk, only the owner of the file can delete it
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

// Upload one or multiple files, associating each with course and school data
router.post(
  "/upload",
  authenticateUser,

  upload.array("files"),
  async (req, res) => {
    try {
      const files = req.files;
      let { courses, schools } = req.body;

      // Normalize courses and schools into arrays if they are not already
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

      // Save each file’s metadata to the database
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

      res.status(200).json({ message: "Files uploaded", files: savedFiles });
    } catch (error) {
      console.error("Upload Error:", error);
      res.status(500).send("Unable to upload file");
    }
  }
);

//  Fetch all files uploaded by the authenticated user
router.get("/all", authenticateUser, async (req, res) => {
  try {
    const userFiles = await fileModel.find({
      userId: new mongoose.Types.ObjectId(req.user._id),
    });

    res.status(200).json(userFiles);
  } catch (error) {
    console.error("Fetch Files Error:", error);
    res.status(500).send("Unable to fetch files");
  }
});

// Search for files by filename, course, or school matching query (case-insensitive)
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

// Retrieve file metadata (filename, course, school) for all files
router.get("/metadata", async (req, res) => {
  try {
    const files = await fileModel.find({}, "filename course school");
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch metadata" });
  }
});

// Find files matching any of the given recommendations (course & school exact match, case-insensitive)
router.post("/match", async (req, res) => {
  const recommendations = req.body.recommendations;

  if (!Array.isArray(recommendations))
    return res.status(400).send("Invalid input");

  try {
    // Create regex queries for exact (case-insensitive) matches on course and school
    const queries = recommendations.map((r) => ({
      course: new RegExp(`^${r.course.trim()}$`, "i"),
      school: new RegExp(`^${r.school.trim()}$`, "i"),
    }));

    const files = await fileModel.find({ $or: queries });

    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Get filename for a given file ID
router.get("/:id/filename", async (req, res) => {
  try {
    const file = await fileModel.findById(req.params.id);

    if (!file) return res.status(404).json({ message: "File not found" });

    res.json({ filename: file.filename });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Increment the 'views' count for a file
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

// Retrieve statistics (views and saves) for a given file
router.get("/:fileId/stats", async (req, res) => {
  const { fileId } = req.params;

  try {
    const file = await fileModel.findById(fileId).select("views saves");

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json({
      fileId: file._id,
      views: file.views,
      saves: file.saves,
    });
  } catch (err) {
    console.error("Error fetching file stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Chat endpoint that uses OpenAI GPT model to answer user questions based on file content
router.post("/chat", async (req, res) => {
  try {
    const { content, userMessage } = req.body;

    if (!content || !userMessage) {
      return res.status(400).json({ error: "Missing content or userMessage." });
    }

    const prompt = `
You are an AI assistant. The following is the content extracted from a file:

${content}

User asks: ${userMessage}

Answer the user's question based on the content above.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.2,
    });

    const botResponse =
      completion.choices[0].message?.content ||
      "Sorry, I couldn't generate a response.";

    res.json({ message: botResponse });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      error: "An error occurred while processing the chatbot message.",
    });
  }
});

export default router;
