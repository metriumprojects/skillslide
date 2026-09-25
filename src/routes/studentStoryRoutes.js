import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getActiveStudentStories,
  getAllStudentStories,
  createStudentStory,
  updateStudentStory,
  deleteStudentStory,
} from "../controllers/studentStoryController.js";

const router = express.Router();

const storyUploads = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },
]);

router.get("/active", getActiveStudentStories);
router.get("/", protect, adminOnly, getAllStudentStories);
router.post("/", protect, adminOnly, storyUploads, createStudentStory);
router.put("/:id", protect, adminOnly, storyUploads, updateStudentStory);
router.delete("/:id", protect, adminOnly, deleteStudentStory);


export default router;
