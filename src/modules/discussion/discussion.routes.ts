import { Router } from "express";
import { discussionController } from "./discussion.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";

const router = Router();

/**
 * GET /discussions/paper/:paperId
 * Get or create discussion for a paper
 * Requires: Access Token + (META_REVIEWER, CHAIR, or ADMIN)
 */
router.get(
  "/paper/:paperId",
  verifyClerkAuth,
  discussionController.getDiscussionByPaper
);

/**
 * POST /discussions/:discussionId/messages
 * Add a message to a discussion
 * Requires: Access Token + (META_REVIEWER or CHAIR)
 */
router.post(
  "/:discussionId/messages",
  verifyClerkAuth,
  discussionController.addMessage
);

/**
 * POST /discussions/:discussionId/close
 * Close a discussion
 * Requires: Access Token + CHAIR
 */
router.post(
  "/:discussionId/close",
  verifyClerkAuth,
  discussionController.closeDiscussion
);

/**
 * POST /discussions/:discussionId/reopen
 * Reopen a discussion
 * Requires: Access Token + CHAIR
 */
router.post(
  "/:discussionId/reopen",
  verifyClerkAuth,
  discussionController.reopenDiscussion
);

/**
 * GET /discussions/conference/:conferenceId
 * Get all discussions for a conference
 * Requires: Access Token + (CHAIR or ADMIN)
 */
router.get(
  "/conference/:conferenceId",
  verifyClerkAuth,
  discussionController.getDiscussionsByConference
);

/**
 * DELETE /discussions/messages/:messageId
 * Delete a message
 * Requires: Access Token + (Message author or CHAIR)
 */
router.delete(
  "/messages/:messageId",
  verifyClerkAuth,
  discussionController.deleteMessage
);

export default router;
