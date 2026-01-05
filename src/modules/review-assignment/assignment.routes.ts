import { Router } from "express";
import { assignmentController } from "./assignment.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { requireAdminOrChair, requireReviewer } from "../auth/auth.middleware";

const router = Router();

/**
 * POST /assignments/create
 * Create a new review assignment
 * Requires: Access Token + Admin or Chair
 */
router.post(
  "/create",
  verifyClerkAuth,
  requireAdminOrChair,
  assignmentController.createAssignment
);

/**
 * DELETE /assignments/:assignmentId
 * Delete an assignment
 * Requires: Access Token + Admin or Chair
 */
router.delete(
  "/:assignmentId",
  verifyClerkAuth,
  requireAdminOrChair,
  assignmentController.deleteAssignment
);

/**
 * GET /assignments/my
 * Get reviewer's assigned papers
 * Requires: Access Token (no conference role check needed - returns all assignments for user)
 * NOTE: This route MUST come before /papers/:paperId to avoid matching "my" as a paperId
 */
router.get(
  "/my",
  verifyClerkAuth,
  assignmentController.getMyAssignments
);

/**
 * GET /assignments/papers/:paperId
 * Get assignments for a paper
 * Requires: Access Token + Admin or Chair
 */
router.get(
  "/papers/:paperId",
  verifyClerkAuth,
  requireAdminOrChair,
  assignmentController.getAssignmentsForPaper
);

/**
 * PATCH /assignments/:assignmentId/status
 * Update assignment status
 * Requires: Access Token (authorization checked in controller)
 */
router.patch(
  "/:assignmentId/status",
  verifyClerkAuth,
  assignmentController.updateAssignmentStatus
);

/**
 * POST /assignments/auto/:conferenceId
 * Auto-assign reviewers for a conference
 * Requires: Access Token + Admin or Chair
 */
router.post(
  "/auto/:conferenceId",
  verifyClerkAuth,
  requireAdminOrChair,
  assignmentController.autoAssign
);

/**
 * GET /assignments/conferences/:conferenceId/stats
 * Get assignment statistics for a conference
 * Requires: Access Token + Admin or Chair
 */
router.get(
  "/conferences/:conferenceId/stats",
  verifyClerkAuth,
  requireAdminOrChair,
  assignmentController.getConferenceStats
);

export default router;
