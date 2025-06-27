import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { initSocket } from "./sockets/commentSocket.js";
import { startInsightCron } from "./cron/insightJob.js";
import authRoutes from "./Routes/Auth.js";
import bookmarkRoutes from "./Routes/Bookmark.js";
import commentRoutes from "./Routes/Comment.js";
import fileRoutes from "./Routes/File.js";
import userRoutes from "./Routes/User.js";
import notificationsRoutes from "./Routes/Notification.js";
import folderRoutes from "./Routes/Folder.js";
import groupChatRoutes from "./Routes/GroupChat.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/", authRoutes);
app.use("/bookmarks", bookmarkRoutes);
app.use("/comment", commentRoutes);
app.use("/file", fileRoutes);
app.use("/user", userRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/folders", folderRoutes);
app.use("/group-chats", groupChatRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Server is ready");
});

server.listen(5000, () => {
  connectDB();
  initSocket(server);
  startInsightCron();
  console.log("Server running at http://localhost:5000");
});
