import { Router } from "express";
import { reviewController } from "./review.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";

const router = Router();

/**
 * GET /reviews/assignments/:assignmentId
 * Get assignment + review (auth inside service)
 */
router.get(
  "/assignments/:assignmentId",
  verifyClerkAuth,
  reviewController.getAssignment
);

/**
 * GET /reviews/papers/:paperId/reviews
 * Get all reviews for a paper (anonymized for non-chair/admin)
 * NOTE: This must come BEFORE /:id to avoid matching "papers" as an id
 */
router.get(
  "/papers/:paperId/reviews",
  verifyClerkAuth,
  reviewController.getPaperReviews
);

/**
 * GET /reviews/:id
 * Get review by assignment ID (for ReviewDetailPage)
 */
router.get(
  "/:id",
  verifyClerkAuth,
  reviewController.getById
);

/**
 * POST /reviews/:assignmentId/draft
 * Save draft review
 */
router.post(
  "/:assignmentId/draft",
  verifyClerkAuth,
  reviewController.saveDraft
);

/**
 * POST /reviews/:assignmentId/submit
 * Submit review (marks assignment SUBMITTED)
 */
router.post(
  "/:assignmentId/submit",
  verifyClerkAuth,
  reviewController.submitReview
);

export default router;

