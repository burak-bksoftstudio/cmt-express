import { Router } from "express";
import { reviewerConflictController } from "./reviewerConflict.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { requireAdminOrChair, requireReviewer } from "../auth/auth.middleware";

const router = Router();

/**
 * POST /conflicts/papers/:paperId/mark
 * Mark a conflict with a paper
 * Requires: Access Token (reviewer marks their own conflict)
 */
router.post(
  "/papers/:paperId/mark",
  verifyClerkAuth,
  requireReviewer,
  reviewerConflictController.markConflict
);

/**
 * POST /conflicts/papers/:paperId/unmark
 * Remove a conflict with a paper
 * Requires: Access Token (reviewer removes their own conflict)
 */
router.post(
  "/papers/:paperId/unmark",
  verifyClerkAuth,
  requireReviewer,
  reviewerConflictController.unmarkConflict
);

/**
 * GET /conflicts/papers/:paperId
 * Get all conflicts for a paper
 * Requires: Access Token + Admin or Chair of paper's conference
 */
router.get(
  "/papers/:paperId",
  verifyClerkAuth,
  requireAdminOrChair,
  reviewerConflictController.getConflicts
);

export default router;

