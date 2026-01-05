import { Request, Response } from "express";
import { authService } from "./auth.service";

export const authController = {
  /**
   * GET /auth/me
   * Get current user info with permissions
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const result = await authService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get user info";
      const status = message === "User not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /auth/users
   * Get all users (admin only)
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await authService.getAllUsers();

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get users";
      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * PATCH /auth/users/:id/admin
   * Toggle admin status for a user (admin only)
   */
  async toggleAdminStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isAdmin } = req.body;

      if (typeof isAdmin !== "boolean") {
        res.status(400).json({
          success: false,
          message: "isAdmin must be a boolean value",
        });
        return;
      }

      const user = await authService.updateAdminStatus(id, isAdmin);

      res.status(200).json({
        success: true,
        message: `User ${isAdmin ? "granted" : "removed"} admin privileges`,
        data: user,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update user";
      const status = message === "User not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};
