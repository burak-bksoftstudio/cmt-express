import { Router } from "express";
import multer from "multer";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import {
  verifyAdmin,
  requireAdminOrChair,
  requireAuthor,
  requireConferenceMember,
} from "../auth/auth.middleware";
import { paperController } from "./paper.controller";

const router = Router();

// Multer memory storage (buffer)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /papers
 * Get all papers (admin or chair of specified conference)
 * Requires: Access Token + Admin or Chair (when conferenceId is provided)
 * Query params: conferenceId (optional for admin, required for chairs)
 */
router.get("/", verifyClerkAuth, paperController.getAllPapers);

/**
 * GET /papers/my
 * Get current user's papers (as author)
 * Requires: Access Token
 */
router.get("/my", verifyClerkAuth, paperController.getMyPapers);

/**
 * POST /papers
 * Create a new paper
 * Requires: Access Token
 */
router.post(
  "/",
  verifyClerkAuth,
  requireConferenceMember,
  paperController.createPaper
);

/**
 * POST /papers/:paperId/upload
 * Upload a file to an existing paper
 * Requires: Access Token
 */
router.post(
  "/:paperId/upload",
  verifyClerkAuth,
  requireAuthor,
  upload.single("file"),
  paperController.uploadPaperFile
);

/**
 * POST /papers/:paperId/authors
 * Add authors to a paper
 * Requires: Access Token (must be author of paper)
 */
router.post(
  "/:paperId/authors",
  verifyClerkAuth,
  requireAuthor,
  paperController.addAuthors
);

/**
 * PATCH /papers/:paperId
 * Update paper metadata (title, abstract, keywords)
 * Only allowed before review starts and before deadline
 * Requires: Access Token (must be author of paper)
 */
router.patch(
  "/:paperId",
  verifyClerkAuth,
  requireAuthor,
  paperController.updatePaper
);

/**
 * DELETE /papers/:paperId/files/:fileId
 * Delete a paper file
 * Only authors can delete files before review assignments
 * Requires: Access Token (must be author of paper)
 */
router.delete(
  "/:paperId/files/:fileId",
  verifyClerkAuth,
  requireAuthor,
  paperController.deleteFile
);

/**
 * GET /papers/:paperId/download
 * Get a presigned download URL for the paper file
 * Authorized users: authors, reviewers, chairs, admins
 * Requires: Access Token
 */
router.get("/:paperId/download", verifyClerkAuth, paperController.downloadPaper);

/**
 * GET /papers/:paperId
 * Get a paper by ID with all related data
 * Requires: Access Token
 * Note: This generic route must be defined AFTER more specific nested routes
 */
router.get("/:paperId", verifyClerkAuth, paperController.getPaperById);

export default router;