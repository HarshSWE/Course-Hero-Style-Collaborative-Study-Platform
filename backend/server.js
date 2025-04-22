import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { fileModel } from "./models/file.model.js";
import multer from "multer";
import cors from "cors";
import fs from "fs";

import path from "path";
import bcrypt from "bcrypt";
import { userModel } from "./models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { bookmarkModel } from "./models/bookmark.model.js";

import { authenticateUser } from "./middleware/authmiddleware.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./backend/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post(
  "/fileupload",
  authenticateUser,
  // It's a Multer middleware that handles multiple file uploads from a form field named "files".

  upload.array("files"),
  async (req, res) => {
    try {
      // Because I am using multer my files are not in req.body.files
      // Because of upload.array("files") multer puts them in req.files

      const files = req.files;
      // All the non file fields are in req.body
      let { courses, schools } = req.body;
      // one value for courses key is treated as String, multiple treated as Array, the same goes for schools, but not files
      if (!Array.isArray(courses)) {
        courses = [courses];
      }
      if (!Array.isArray(schools)) {
        schools = [schools];
      }

      if (!files || files.length === 0) {
        return res.status(400).send("No files uploaded");
      }
      // This makes courses and school fields mandatory, adjust in filemodel later
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

app.get("/myfiles", authenticateUser, async (req, res) => {
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

app.delete("/file/:filename", authenticateUser, async (req, res) => {
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

app.delete("/unbookmark/:fileId", authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id; // Get the user ID from the authenticated user
    const fileId = req.params.fileId; // Get the file ID from the request parameters

    console.log("Received unbookmark request");
    console.log("userId:", userId);
    console.log("fileId:", fileId);

    if (!userId) {
      console.log("Unauthorized - userId missing");
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Assuming you have a separate collection for bookmarks (bookmarksModel)
    const deletedBookmark = await bookmarkModel.deleteOne({
      userId: userId, // Ensure you're deleting the bookmark for the right user
      fileId: fileId, // Match the fileId to delete the specific bookmark
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

app.get("/search", async (req, res) => {
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

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "User created successfully",
      token,
      user: { name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/bookmark/:fileId", authenticateUser, async (req, res) => {
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

app.get("/bookmarks", authenticateUser, async (req, res) => {
  const userId = req.user._id;
  const bookmarks = await bookmarkModel.find({ userId }).select("fileId");
  res.status(200).json(bookmarks.map((b) => b.fileId.toString()));
});

app.get("/bookmarked-files", authenticateUser, async (req, res) => {
  const userId = req.user._id;
  const bookmarks = await bookmarkModel.find({ userId }).populate("fileId");
  const files = bookmarks.map((b) => b.fileId);
  res.status(200).json(files);
});

app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.listen(5000, () => {
  connectDB();
  console.log("Server started at http://localhost:5000");
});
