import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addCurriculumRating, addLessonRating, addTeacherRating, curriculumRating, lessonRating, checkReviewEligibility } from "../controllers/ratingController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/eligibility", protect, checkReviewEligibility);
router.post("/curriculum", protect, upload.single("image"), addCurriculumRating);
router.post("/lesson", protect, upload.single("image"), addLessonRating);
router.post("/teacher", protect, addTeacherRating);
router.get("/curriculum/:id", curriculumRating);
router.get("/lesson/:id", lessonRating);
export default router;
