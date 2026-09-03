import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { createFullCurriculum,  getAllCurriculums,getFormattedCurriculum,
  getSingleCurriculum,
  updateCurriculum,
  deleteCurriculum,
  getTeacherCurriculums,
  getAllCurriculumById, } from "../controllers/curriculumController.js";
import { compressImages } from "../middleware/compressImages.js";

const router = express.Router();

// Single endpoint for full curriculum (curriculum + units + lessons)
router.post("/create-curriculum", protect, upload.any(), compressImages,createFullCurriculum);
router.get("/all-curriculum", getAllCurriculums);
router.get("/teacher-curriculum", protect,getTeacherCurriculums);
router.get("/single-curriculum/:id",protect, getFormattedCurriculum);
router.get("/curriculum/:id", getSingleCurriculum);
router.put("/update-curriculum/:id", protect, upload.any(),compressImages, updateCurriculum);
router.delete("/delete-curriculum/:id", protect, deleteCurriculum);
router.get("/curriculum-by-teacher/:id",  getAllCurriculumById);
export default router;
