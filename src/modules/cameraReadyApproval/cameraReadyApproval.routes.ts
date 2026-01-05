import { Router } from "express";
import { cameraReadyApprovalController } from "./cameraReadyApproval.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { requireAdminOrChair } from "../auth/auth.middleware";

const router = Router();

/**
 * POST /camera-ready-approval/papers/:paperId/approve
 * Approve camera-ready file for a paper
 * Requires: Access Token + (Admin or Chair of the conference)
 */
router.post(
  "/papers/:paperId/approve",
  verifyClerkAuth,
  requireAdminOrChair,
  cameraReadyApprovalController.approve
);

/**
 * POST /camera-ready-approval/papers/:paperId/reject
 * Reject camera-ready file for a paper (needs revision)
 * Requires: Access Token + (Admin or Chair of the conference)
 */
router.post(
  "/papers/:paperId/reject",
  verifyClerkAuth,
  requireAdminOrChair,
  cameraReadyApprovalController.reject
);

/**
 * GET /camera-ready-approval/papers/:paperId/status
 * Get camera-ready status for a paper
 * Requires: Access Token + (Admin or Chair of the conference)
 */
router.get(
  "/papers/:paperId/status",
  verifyClerkAuth,
  requireAdminOrChair,
  cameraReadyApprovalController.getStatus
);

export default router;

