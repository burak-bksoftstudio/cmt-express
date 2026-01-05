import { Router } from "express";
import { metareviewController } from "./metareview.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";

const router = Router();

/**
 * POST /metareviews
 * Create a new metareview
 * Requires: Access Token + META_REVIEWER or CHAIR role
 */
router.post("/", verifyClerkAuth, metareviewController.createMetareview);

/**
 * PUT /metareviews/:id
 * Update a metareview
 * Requires: Access Token + (Meta-reviewer who owns it or CHAIR)
 */
router.put("/:id", verifyClerkAuth, metareviewController.updateMetareview);

/**
 * POST /metareviews/:id/submit
 * Submit a metareview
 * Requires: Access Token + Meta-reviewer who owns it
 */
router.post("/:id/submit", verifyClerkAuth, metareviewController.submitMetareview);

/**
 * GET /metareviews/paper/:paperId
 * Get metareview for a specific paper
 * Requires: Access Token + (META_REVIEWER, CHAIR, or ADMIN)
 */
router.get("/paper/:paperId", verifyClerkAuth, metareviewController.getMetareviewByPaper);

/**
 * GET /metareviews/conference/:conferenceId
 * Get all metareviews for a conference
 * Requires: Access Token + (CHAIR or ADMIN)
 */
router.get(
  "/conference/:conferenceId",
  verifyClerkAuth,
  metareviewController.getMetareviewsByConference
);

/**
 * GET /metareviews/my
 * Get metareviews assigned to the current user
 * Query params: ?conferenceId=xxx (optional)
 * Requires: Access Token
 */
router.get("/my", verifyClerkAuth, metareviewController.getMyMetareviews);

/**
 * DELETE /metareviews/:id
 * Delete a metareview (only if not submitted)
 * Requires: Access Token + (Meta-reviewer who owns it or CHAIR)
 */
router.delete("/:id", verifyClerkAuth, metareviewController.deleteMetareview);

export default router;
