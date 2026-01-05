import { Router } from "express";
import { biddingController } from "./bidding.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { requireAdminOrChair, requireReviewer } from "../auth/auth.middleware";

const router = Router();

/**
 * POST /review-bids/papers/:paperId
 * Submit or update a bid for a paper
 * Requires: Access Token (Reviewer)
 */
router.post(
  "/papers/:paperId",
  verifyClerkAuth,
  requireReviewer,
  biddingController.submitBid
);

/**
 * GET /review-bids/my
 * Get all bids made by the current reviewer
 * Requires: Access Token
 * NOTE: This route MUST come before /papers/:paperId to avoid matching "my" as a paperId
 */
router.get(
  "/my",
  verifyClerkAuth,
  requireReviewer,
  biddingController.getMyBids
);

/**
 * GET /review-bids/papers/:paperId
 * Get reviewer's bid for a specific paper
 * Requires: Access Token
 */
router.get(
  "/papers/:paperId",
  verifyClerkAuth,
  requireReviewer,
  biddingController.getBid
);

/**
 * GET /review-bids/conferences/:conferenceId
 * Get bidding matrix for a conference
 * Requires: Access Token + Admin or Chair
 */
router.get(
  "/conferences/:conferenceId",
  verifyClerkAuth,
  requireAdminOrChair,
  biddingController.getConferenceBiddingMatrix
);

/**
 * GET /review-bids/conferences/:conferenceId/papers
 * Get papers available for bidding
 * Requires: Access Token
 */
router.get(
  "/conferences/:conferenceId/papers",
  verifyClerkAuth,
  requireReviewer,
  biddingController.getPapersForBidding
);

export default router;
