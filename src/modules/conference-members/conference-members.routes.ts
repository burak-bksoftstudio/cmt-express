import { Router } from "express";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { requireAdminOrChair, requireConferenceMember } from "../auth/auth.middleware";
import { conferenceMembersController } from "./conference-members.controller";

const router = Router({ mergeParams: true });

/**
 * Middleware to verify if the user is a CHAIR of the conference
 * or an admin
 */
/**
 * GET /conferences/:id/members
 * Get all members of a conference
 * Requires: Access Token + Conference Member (any role)
 */
router.get("/", verifyClerkAuth, requireConferenceMember, conferenceMembersController.getMembers);

/**
 * POST /conferences/:id/members
 * Add a member to a conference
 * Requires: Access Token + (Admin or Chair)
 */
router.post(
  "/",
  verifyClerkAuth,
  requireAdminOrChair,
  conferenceMembersController.addMember
);

/**
 * PATCH /conferences/:id/members/:memberId
 * Update a member's role
 * Requires: Access Token + (Admin or Chair)
 */
router.patch(
  "/:memberId",
  verifyClerkAuth,
  requireAdminOrChair,
  conferenceMembersController.updateMember
);

/**
 * DELETE /conferences/:id/members/:memberId
 * Remove a member from a conference
 * Requires: Access Token + (Admin or Chair)
 */
router.delete(
  "/:memberId",
  verifyClerkAuth,
  requireAdminOrChair,
  conferenceMembersController.removeMember
);

export default router;

