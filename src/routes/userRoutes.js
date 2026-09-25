import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  logoutUser,
  changePassword,
  updateProfileImage,
  updateProfile,
  becomeTeacher,
  isOnlineTeacher,
  getUserById,
  googleLogin,
  verifyEmail,

} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/verify/:token", authLimiter, verifyEmail);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.get("/profile", protect, getUserProfile);
router.post("/change-password", protect, changePassword);
router.get("/logout-user", logoutUser);
router.post("/update-image", protect, upload.single("image"), updateProfileImage);
router.post("/update-profile", protect,updateProfile);
router.post("/become-teacher", protect,becomeTeacher);
router.post("/isonline-teacher", protect,isOnlineTeacher);
router.get("/user/:id", protect,getUserById);
router.post("/google-login", authLimiter, googleLogin);

export default router;
