import { Router } from "express";
import { authController } from "./auth.controller";
import { verifyClerkAuth } from "./clerk.middleware";
import { verifyAdmin } from "./auth.middleware";

const router = Router();

/**
 * GET /auth/me
 * Get current user info with permissions
 * Requires: Clerk session
 */
router.get("/me", verifyClerkAuth, authController.getMe);

/**
 * GET /auth/users
 * Get all users (admin only)
 * Requires: Clerk session + Admin
 */
router.get("/users", verifyClerkAuth, verifyAdmin, authController.getAllUsers);

/**
 * PATCH /auth/users/:id/admin
 * Toggle admin status for a user (admin only)
 * Requires: Clerk session + Admin
 */
router.patch("/users/:id/admin", verifyClerkAuth, verifyAdmin, authController.toggleAdminStatus);

export default router;
