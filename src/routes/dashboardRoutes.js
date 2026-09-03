import express from "express";
import { protect } from "../middleware/authMiddleware.js";

import { changeUserRole, deleteUser, getAllCurriculums, getAllData, getAllLessons, getAllUser, getSettings, loginAdmin, loginUserByAdmin, updateSettings, updateUser } from "../controllers/dashboardController.js";


const router = express.Router();

router.post("/admin-login",   loginAdmin);
router.get("/user-login/:id",  loginUserByAdmin);
router.get("/all-user", protect,  getAllUser);
router.post("/update-user/:id", protect,  updateUser);
router.delete("/delete-user/:id",protect, deleteUser);
router.patch("/change-role/:id", changeUserRole);

router.get("/all-lesson", protect,  getAllLessons);
router.get("/all-curriculum", protect,  getAllCurriculums);
router.get("/all-data", protect,  getAllData);
router.get("/settings", protect, getSettings);
router.put("/settings", protect, updateSettings);

export default router;
