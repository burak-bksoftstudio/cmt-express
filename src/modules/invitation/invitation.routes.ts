import { Router } from "express";
import { invitationController } from "./invitation.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";

const router = Router();

/**
 * POST /invitations
 * Send an invitation to join a conference
 * Requires: Access Token + Chair role
 */
router.post("/", verifyClerkAuth, invitationController.sendInvitation);

/**
 * GET /invitations/my
 * Get my invitations
 * Requires: Access Token
 */
router.get("/my", verifyClerkAuth, invitationController.getMyInvitations);

/**
 * POST /invitations/:id/accept
 * Accept an invitation
 * Requires: Access Token
 */
router.post("/:id/accept", verifyClerkAuth, invitationController.acceptInvitation);

/**
 * POST /invitations/:id/decline
 * Decline an invitation
 * Requires: Access Token
 */
router.post("/:id/decline", verifyClerkAuth, invitationController.declineInvitation);

/**
 * DELETE /invitations/:id
 * Cancel an invitation (chair only)
 * Requires: Access Token + Chair role
 */
router.delete("/:id", verifyClerkAuth, invitationController.cancelInvitation);

export default router;
