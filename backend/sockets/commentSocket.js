import { Server } from "socket.io";

let io = null;

// Map to keep track of connected users and their socket IDs
const userSockets = {};

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });
  // Handle a new socket connection
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Register a user ID to a socket ID when a user connects
    socket.on("register", (userId) => {
      userSockets[userId] = socket.id;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });
    // Broadcast a new comment, in a file's comment section to all connected clients.
    socket.on("newComment", (comment) => {
      io.emit("receiveComment", comment);
    });

    // Broadcast a comment deletion event to all clients, in a file's comment section.
    socket.on("deleteComment", ({ id }) => {
      io.emit("commentDeleted", { id });
    });

    // Broadcast a comment update to all clients, in a files comment section
    socket.on("updateComment", (updatedComment) => {
      io.emit("commentUpdated", updatedComment);
    });

    // Broadcast a system message to a group chat when members are added.
    socket.on("membersAddedToGroup", ({ chatId, userNames }) => {
      const content = `${userNames.join(", ")} joined the chat`;
      io.to(chatId).emit("receiveGroupMessage", {
        message: {
          _id: new Date().toISOString(),
          senderId: { name: "System" },
          content,
          createdAt: new Date(),
          type: "system",
        },
      });
    });

    // Broadcast a system message to a group chat when a member leaves.
    socket.on("memberLeftGroup", ({ chatId, username }) => {
      io.to(chatId).emit("receiveGroupMessage", {
        message: {
          _id: new Date().toISOString(),
          senderId: { name: "System" },
          content: `${username} left the chat`,
          createdAt: new Date(),
          type: "system",
        },
      });
    });

    //  Broadcast a message to a group chat room and notify clients globally.
    socket.on("sendGroupMessage", ({ chatId, message }) => {
      io.to(chatId).emit("receiveGroupMessage", { message });
      io.emit("new-group-message", { chatId });
    });

    // Allow a socket to join a specific group chat room.
    socket.on("joinGroupChat", (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined group chat ${chatId}`);
    });

    //  Allow a socket to leave a specific group chat room.
    socket.on("leaveGroupChat", (chatId) => {
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left group chat ${chatId}`);
    });

    //Handle socket disconnection, remove the user from userSockets map if present.
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", socket.id, "Reason:", reason);
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
