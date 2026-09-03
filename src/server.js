import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import socketHandler from "./socket/socketHandler.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["https://skillask.com", "http://localhost:5173", "http://localhost:5174", "https://courses-website-drab.vercel.app", "http://localhost", "capacitor://localhost"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});


// Pass io to socket handler
socketHandler(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
