import { io } from "socket.io-client";

const socket = io("http://localhost:5050"); // Update with your server URL

export function ConnectionHandler() {
  const connect = () => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("file-created", (data) => {
      console.log("File created:", data);
    });

    socket.on("error", (err) => {
      console.error("WebSocket error:", err);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });
  };

  return {
    connect,
    socket,
  };
}