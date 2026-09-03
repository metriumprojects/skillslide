import dns from "node:dns";
import mongoose from "mongoose";
import User from "../models/User.js";

// Set reliable public DNS to prevent querySrv ECONNREFUSED on local routers
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set DNS servers:", e.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    await User.updateMany(
      { currency: { $nin: ["USD", "EUR"] } },
      { $set: { currency: "USD" } }
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
