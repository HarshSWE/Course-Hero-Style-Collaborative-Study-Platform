import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./Routes/Auth.js";
import bookmarkRoutes from "./Routes/Bookmark.js";
import commentRoutes from "./Routes/Comment.js";
import fileRoutes from "./Routes/File.js";
import userRoutes from "./Routes/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRoutes);
app.use("/bookmarks", bookmarkRoutes);
app.use("/comment", commentRoutes);
app.use("/file", fileRoutes);
app.use("/user", userRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Server is ready");
});

app.listen(5000, () => {
  connectDB();
  console.log("Server started at http://localhost:5000");
});
