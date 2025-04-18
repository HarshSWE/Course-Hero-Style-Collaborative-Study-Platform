// Entry point of the applications backend
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { fileModel } from "./models/file.model.js";
//Multer helps you handle fileuploads
import multer from "multer";
// By default the browser will block requests from frontend to backend due to security rules, but this will allow it
import cors from "cors";
// Gives you access to the file system on the server, so you can read, write, delete, or move files on the server.
import fs from "fs";
// Different operating systems use different path separators, Windows: C:\Users\Harsh\project, macOS/Linux: /Users/Harsh/project
// This lets my paths work correctly on any os
import path from "path";
// let's you securely hash passwords, we need to do this because if someone breaks into your database and passwords are stored in plain text, they can instantly read every user's password.
import bcrypt from "bcrypt";
import { userModel } from "./models/user.model.js";
// Json web token for authentication
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { authenticateUser } from "./middleware/authmiddleware.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Let's you access from .env files
dotenv.config();
const app = express();
app.use(cors());
// It tells your Express app to automatically parse incoming requests with JSON payloads
app.use(express.json());

// File storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Typical node.js callback convention is cb(error, result)
    // this is saying there is no error
    cb(null, "./backend/uploads");
  },
  filename: function (req, file, cb) {
    // file.originalname gives you the original name of the file
    // if someone uploads a file called notes.pdf then file.originalname === "notes.pdf"
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// tells multer to use the storage I defined above.
const upload = multer({ storage });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Upload files route
// "files" is the name attribute in the form input (<input type="file" name="files" multiple />) that allows users to select multiple files to upload.
// it is a middleware that allows multiple files to be uploaded under the "files" field.
// middleware runs between the request and response cycle.
app.post(
  "/fileupload",
  authenticateUser,
  upload.array("files"),
  async (req, res) => {
    try {
      const files = req.files;
      console.log(req.files);
      if (!files || files.length === 0) {
        return res.status(400).send("No files uploaded");
      }

      const savedFiles = [];

      for (const file of files) {
        const { path, filename, originalname } = file;
        // user._id save works cause that id is in our database
        const newFile = new fileModel({ path, filename, userId: req.user._id });
        await newFile.save();
        savedFiles.push({ filename, originalname });
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
    // returns an array of file documents
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

// Delete file
// Dynamic route where filename is the parameter
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

app.post("/signup", async (req, res) => {
  try {
    // req.body in Express refers to the request body of an HTTP request. It contains data sent by the client
    // When a client submits data (like a form, JSON, or other payload) to the server, that data is sent as the request body.
    const { name, email, password } = req.body;
    // Searches database for a documnet in this case a user, for the specified email
    const existingUser = await userModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // 10 is number of salt rounds bcrypt will apply to the password,
    // Salt rounds are the number of times bcrypt will apply the hashing algorithm to the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hashedPassword });
    await newUser.save();

    // Create JWT
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

    // Generate token, sign is the method used for it
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

// When you go to localhost:5000/
app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.listen(5000, () => {
  connectDB();
  console.log("Server started at http://localhost:5000");
});
