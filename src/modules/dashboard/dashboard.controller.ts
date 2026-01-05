import { Request, Response } from "express";
import { dashboardService } from "./dashboard.service";
import { prisma } from "../../config/prisma";
import { getUserConferenceRole } from "../auth/auth.middleware";

export const dashboardController = {
  /**
   * GET /dashboard/my
   * Get user's dashboard data grouped by roles
   * Requires: Access Token
   */
  async getMyDashboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const data = await dashboardService.getMyDashboard(userId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get dashboard data";

      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /dashboard/conferences/:conferenceId
   * Get comprehensive stats for a conference
   * SECURITY: Reviewer/timeline data only visible to chair/admin
   * Requires: Access Token + Conference membership
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const conferenceId = req.params.id || req.params.conferenceId;

      if (!conferenceId) {
        res.status(400).json({
          success: false,
          message: "conferenceId is required",
        });
        return;
      }

      // Determine if user is chair or admin
      let isChairOrAdmin = false;

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        });

        if (user?.isAdmin) {
          isChairOrAdmin = true;
        } else {
          const role = await getUserConferenceRole(userId, conferenceId);
          isChairOrAdmin = role.isChair;
        }
      }

      const stats = await dashboardService.getConferenceStats(conferenceId, userId, isChairOrAdmin);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get conference stats";

      const status = message === "Conference not found" ? 404 : 500;

      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};

