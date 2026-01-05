import { Router } from "express";
import { decisionController } from "./decision.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { requireAdminOrChair } from "../auth/auth.middleware";

const router = Router();

/**
 * POST /decisions/papers/:paperId/make
 * Make a decision on a paper
 * Requires: Access Token + (Admin or Chair of the paper's conference)
 */
router.post(
  "/papers/:paperId/make",
  verifyClerkAuth,
  requireAdminOrChair,
  decisionController.makeDecision
);

/**
 * GET /decisions/papers/:paperId/info
 * Get paper info with decision details (works even without a decision)
 * Useful for Paper Detail > Decision Section UI
 * Requires: Access Token (Authors can see their own paper's decision - anonymized)
 * Note: Service layer handles authorization and double-blind anonymization
 */
router.get(
  "/papers/:paperId/info",
  verifyClerkAuth,
  decisionController.getPaperDecisionInfo
);

/**
 * GET /decisions/papers/:paperId
 * Get the decision for a paper
 * Requires: Access Token + (Admin or Chair of the paper's conference)
 */
router.get(
  "/papers/:paperId",
  verifyClerkAuth,
  requireAdminOrChair,
  decisionController.getDecision
);

export default router;

