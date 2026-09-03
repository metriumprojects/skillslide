import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createConnectAccountSession,
  createConnectDashboardLink,
  createConnectOnboardingLink,
  getConnectBalance,
  getConnectCountries,
  getConnectStatus,
} from "../controllers/stripeConnectController.js";

const router = express.Router();

router.get("/countries", protect, getConnectCountries);
router.get("/status", protect, getConnectStatus);
router.post("/onboarding-link", protect, createConnectOnboardingLink);
router.post("/account-session", protect, createConnectAccountSession);
router.post("/dashboard-link", protect, createConnectDashboardLink);
router.get("/balance", protect, getConnectBalance);

export default router;

