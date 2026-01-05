import { Router } from "express";
import { conferenceRequestController } from "./conferenceRequest.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { verifyAdmin } from "../auth/auth.middleware";

const router = Router();

/**
 * POST /conference-requests
 * Create a new conference request
 * Requires: Access Token
 */
router.post("/", verifyClerkAuth, conferenceRequestController.createRequest);

/**
 * GET /conference-requests/my
 * Get my conference requests
 * Requires: Access Token
 */
router.get("/my", verifyClerkAuth, conferenceRequestController.getMyRequests);

/**
 * GET /conference-requests
 * Get all conference requests
 * Requires: Access Token + Admin
 */
router.get("/", verifyClerkAuth, verifyAdmin, conferenceRequestController.getAll);

/**
 * POST /conference-requests/:id/approve
 * Approve a conference request
 * Requires: Access Token + Admin
 */
router.post("/:id/approve", verifyClerkAuth, verifyAdmin, conferenceRequestController.approve);

/**
 * POST /conference-requests/:id/reject
 * Reject a conference request
 * Requires: Access Token + Admin
 */
router.post("/:id/reject", verifyClerkAuth, verifyAdmin, conferenceRequestController.reject);

export default router;

