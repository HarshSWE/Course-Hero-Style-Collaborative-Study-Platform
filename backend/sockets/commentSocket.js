import { Server } from "socket.io";

let io = null;
const userSockets = {};

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register", (userId) => {
      userSockets[userId] = socket.id;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on("newComment", (comment) => {
      io.emit("receiveComment", comment);
    });

    socket.on("deleteComment", ({ id }) => {
      io.emit("commentDeleted", { id });
    });

    socket.on("updateComment", (updatedComment) => {
      io.emit("commentUpdated", updatedComment);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      for (const [userId, socketId] of Object.entries(userSockets)) {
        if (socketId === socket.id) {
          delete userSockets[userId];
          console.log(`User ${userId} removed from active sockets`);
          break;
        }
      }
    });
  });
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

export function getUserSockets() {
  return userSockets;
}
