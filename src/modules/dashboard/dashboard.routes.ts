import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { requireAdminOrChair } from "../auth/auth.middleware";

const router = Router();

/**
 * GET /dashboard/my
 * Get user's dashboard data grouped by roles
 * Requires: Access Token
 */
router.get("/my", verifyClerkAuth, dashboardController.getMyDashboard);

/**
 * GET /dashboard/conferences/:id
 * Get comprehensive stats for a conference
 * Requires: Access Token + (Admin or Chair of the conference)
 */
router.get(
  "/conferences/:id",
  verifyClerkAuth,
  requireAdminOrChair,
  dashboardController.getStats
);

export default router;

