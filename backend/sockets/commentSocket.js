import { Server } from "socket.io";

let io = null;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",

      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

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
    });
  });
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
