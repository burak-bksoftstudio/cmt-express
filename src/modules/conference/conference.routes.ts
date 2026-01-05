import { Router } from "express";
import { conferenceController } from "./conference.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { verifyAdmin, requireAdminOrChair } from "../auth/auth.middleware";
import { invitationController } from "../invitation/invitation.controller";

const router = Router();

/**
 * POST /conferences
 * Create a new conference
 * Requires: Access Token + Admin
 */
router.post("/", verifyClerkAuth, verifyAdmin, conferenceController.createConference);

/**
 * GET /conferences
 * Get all conferences (public)
 */
router.get("/", conferenceController.getAll);

/**
 * GET /conferences/my
 * Get user's conferences
 * Requires: Access Token
 * - Admin sees all conferences
 * - Chair sees only their conferences
 */
router.get("/my", verifyClerkAuth, conferenceController.getMyConferences);

/**
 * GET /conferences/:id
 * Get a single conference (public)
 */
router.get("/:id", conferenceController.getOne);

/**
 * PUT /conferences/:id
 * Update a conference
 * Requires: Access Token + (Admin or Chair of this conference)
 */
router.put("/:id", verifyClerkAuth, requireAdminOrChair, conferenceController.updateConference);

/**
 * PUT /conferences/:id/settings
 * Update conference settings (deadlines, review settings)
 * Requires: Access Token + (Admin or Chair of this conference)
 */
router.put("/:id/settings", verifyClerkAuth, requireAdminOrChair, conferenceController.updateSettings);

/**
 * POST /conferences/:id/assign-chair
 * Assign a chair to a conference
 * Requires: Access Token + Admin
 */
router.post("/:id/assign-chair", verifyClerkAuth, verifyAdmin, conferenceController.assignChair);

/**
 * POST /conferences/:id/join
 * User joins a conference as "member"
 * Requires: Access Token
 */
router.post("/:id/join", verifyClerkAuth, conferenceController.joinConference);

/**
 * POST /conferences/:id/add-user
 * Chair adds a user to conference as "member"
 * Requires: Access Token + Chair of this conference
 */
router.post(
  "/:id/add-user",
  verifyClerkAuth,
  requireAdminOrChair,
  conferenceController.addUser
);

/**
 * POST /conferences/:id/assign-reviewer
 * Chair promotes a member to "reviewer" role
 * Requires: Access Token + Chair of this conference
 */
router.post(
  "/:id/assign-reviewer",
  verifyClerkAuth,
  requireAdminOrChair,
  conferenceController.assignReviewer
);

/**
 * GET /conferences/:id/members
 * MOVED TO: /api/conferences/:id/members (conference-members.routes.ts)
 * This route is now handled by the dedicated conference-members module
 */
// router.get(
//   "/:id/members",
//   verifyClerkAuth,
//   requireAdminOrChair,
//   conferenceController.getMembers
// );

/**
 * GET /conferences/:id/tracks
 * Get all tracks for a conference
 * Requires: Access Token
 */
router.get("/:id/tracks", verifyClerkAuth, conferenceController.getTracks);

/**
 * POST /conferences/:id/tracks
 * Create a new track for a conference
 * Requires: Access Token + (Admin or Chair of this conference)
 */
router.post(
  "/:id/tracks",
  verifyClerkAuth,
  requireAdminOrChair,
  conferenceController.createTrack
);

/**
 * DELETE /conferences/:id/tracks/:trackId
 * Delete a track from a conference
 * Requires: Access Token + (Admin or Chair of this conference)
 */
router.delete(
  "/:id/tracks/:trackId",
  verifyClerkAuth,
  requireAdminOrChair,
  conferenceController.deleteTrack
);

/**
 * POST /conferences/:id/archive
 * Archive a conference
 * Requires: Access Token + (Admin or Chair of this conference)
 */
router.post(
  "/:id/archive",
  verifyClerkAuth,
  requireAdminOrChair,
  conferenceController.archiveConference
);

/**
 * POST /conferences/:id/unarchive
 * Unarchive a conference
 * Requires: Access Token + (Admin or Chair of this conference)
 */
router.post(
  "/:id/unarchive",
  verifyClerkAuth,
  requireAdminOrChair,
  conferenceController.unarchiveConference
);

/**
 * GET /conferences/:conferenceId/invitations
 * Get all invitations for a conference
 * Requires: Access Token + Chair of this conference
 */
router.get(
  "/:conferenceId/invitations",
  verifyClerkAuth,
  requireAdminOrChair,
  invitationController.getConferenceInvitations
);

export default router;
