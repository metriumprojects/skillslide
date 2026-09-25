import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import socketHandler from "./socket/socketHandler.js";

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

const allowedSocketOrigins = [
  "https://skillask.com",
  "https://www.skillask.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://courses-website-drab.vercel.app",
  "http://localhost",
  "capacitor://localhost",
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedSocketOrigins.includes(origin) || allowedSocketOrigins.includes("*")) {
        callback(null, true);
      } else if (
        origin.startsWith("capacitor://") ||
        origin.startsWith("ionic://") ||
        origin.startsWith("http://localhost") ||
        origin.startsWith("https://localhost")
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all or matched origins for sockets
      }
    },
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
