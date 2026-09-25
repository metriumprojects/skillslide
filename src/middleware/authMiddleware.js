import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // ✅ Read token from Authorization header (for mobile apps)
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // ✅ Read token from cookie (for website)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Please login your account" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ status: false, message: "User not found or account deactivated" });
    }

    next();
  } catch (error) {
    console.error("Auth error:", error.message || error);
    res.status(401).json({ status: false, message: "Not authorized, token invalid or expired" });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ status: false, message: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ status: false, message: "Admin access required" });
  }
  next();
};

