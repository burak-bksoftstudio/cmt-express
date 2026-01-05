import { Request, Response } from "express";
import { reviewerConflictService } from "./reviewerConflict.service";

export const reviewerConflictController = {
  /**
   * POST /conflicts/papers/:paperId/mark
   * Mark a conflict with a paper
   * Requires: verifyAccessToken
   * Only the reviewer themselves can mark conflict
   */
  async markConflict(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
        });
        return;
      }

      const conflict = await reviewerConflictService.markConflict(paperId, userId);

      res.status(201).json({
        success: true,
        message: "Conflict declared successfully",
        data: conflict,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to mark conflict";

      let status = 400;
      if (message === "Paper not found") {
        status = 404;
      } else if (message === "Conflict already declared") {
        status = 400;
      }

      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conflicts/papers/:paperId/unmark
   * Remove a conflict with a paper
   * Requires: verifyAccessToken
   * Only the reviewer themselves can unmark conflict
   */
  async unmarkConflict(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
        });
        return;
      }

      const result = await reviewerConflictService.unmarkConflict(paperId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unmark conflict";

      let status = 400;
      if (message === "Conflict not found") {
        status = 404;
      }

      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conflicts/papers/:paperId
   * Get all conflicts for a paper
   * Requires: verifyAccessToken + verifyAdminOrChairOfPaper
   * Only admins/chairs can view conflicts
   */
  async getConflicts(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;

      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
        });
        return;
      }

      const conflicts = await reviewerConflictService.getConflictsByPaper(paperId);

      res.status(200).json({
        success: true,
        data: conflicts,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get conflicts";

      let status = 500;
      if (message === "Paper not found") {
        status = 404;
      }

      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};

