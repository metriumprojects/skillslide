import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import {
  changeUserRole,
  deleteUser,
  getAllCurriculums,
  getAllData,
  getAllLessons,
  getAllUser,
  getSettings,
  loginAdmin,
  loginUserByAdmin,
  updateSettings,
  updateUser,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.post("/admin-login", authLimiter, loginAdmin);
router.get("/user-login/:id", protect, adminOnly, loginUserByAdmin);
router.get("/all-user", protect, adminOnly, getAllUser);
router.post("/update-user/:id", protect, adminOnly, updateUser);
router.delete("/delete-user/:id", protect, adminOnly, deleteUser);
router.patch("/change-role/:id", protect, adminOnly, changeUserRole);

router.get("/all-lesson", protect, adminOnly, getAllLessons);
router.get("/all-curriculum", protect, adminOnly, getAllCurriculums);
router.get("/all-data", protect, adminOnly, getAllData);
router.get("/settings", protect, getSettings);
router.put("/settings", protect, adminOnly, updateSettings);

export default router;

