import { Router } from "express";
import multer from "multer";
import { cameraReadyController } from "./cameraReady.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { requirePaperAuthorOrChair, requireConferenceMember } from "../auth/auth.middleware";

const router = Router();

// Multer memory storage (buffer)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /camera-ready/papers/:paperId/upload
 * Upload camera-ready file for an accepted paper
 * Requires: Access Token (user must be paper author or conference chair)
 */
router.post(
  "/papers/:paperId/upload",
  verifyClerkAuth,
  requirePaperAuthorOrChair,
  upload.single("file"),
  cameraReadyController.upload
);

/**
 * GET /camera-ready/papers/:paperId
 * Get camera-ready files for a paper
 * Requires: Access Token
 */
router.get(
  "/papers/:paperId",
  verifyClerkAuth,
  requireConferenceMember,
  cameraReadyController.getFiles
);

export default router;

