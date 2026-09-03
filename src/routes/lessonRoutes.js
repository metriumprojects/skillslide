import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  createLesson,
  getAllLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  getTeacherLessons,
  getLesson,
  getAllLessonsById
} from "../controllers/lessonController.js";
import { compressImages } from "../middleware/compressImages.js";

const router = express.Router();

// CreateLesson sends the cover and gallery images under the same `images` field.
// The UI allows 10 gallery images, so accept 1 cover + 10 gallery images.
router.post("/create", protect, upload.array("images", 11), compressImages, createLesson);
router.get("/get-lesson", getAllLessons);
router.get("/teacher-lesson", protect, getTeacherLessons);
router.get("/lesson/:id", getLessonById);
router.put("/update-lesson/:id", protect, upload.any("images", 5),compressImages, updateLesson);
router.delete("/delete-lesson/:id",protect, protect, deleteLesson);
router.get("/getLesson/:id", getLesson);
router.get("/lesson-by-teacher/:id", getAllLessonsById);

export default router;
