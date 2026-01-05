import { Request, Response } from "express";
import { cameraReadyApprovalService } from "./cameraReadyApproval.service";

export const cameraReadyApprovalController = {
  /**
   * POST /camera-ready-approval/papers/:paperId/approve
   * Approve camera-ready file for a paper
   * Requires: Access Token + (Admin or Chair of the conference)
   */
  async approve(req: Request, res: Response): Promise<void> {
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

      const result = await cameraReadyApprovalService.approve(paperId, userId);

      res.status(200).json({
        success: true,
        message: "Camera-ready approved",
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to approve camera-ready";

      let status = 500;
      if (message === "Paper not found" || message === "User not found") {
        status = 404;
      } else if (message === "No camera-ready files uploaded for this paper") {
        status = 400;
      } else if (message.includes("Only admin or chair")) {
        status = 403;
      }

      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /camera-ready-approval/papers/:paperId/reject
   * Reject camera-ready file for a paper (needs revision)
   * Requires: Access Token + (Admin or Chair of the conference)
   */
  async reject(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;
      const userId = req.user?.userId;
      const { comment } = req.body;

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

      if (!comment) {
        res.status(400).json({
          success: false,
          message: "comment is required",
        });
        return;
      }

      const result = await cameraReadyApprovalService.reject(
        paperId,
        userId,
        comment
      );

      res.status(200).json({
        success: true,
        message: "Camera-ready rejected",
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject camera-ready";

      let status = 500;
      if (message === "Paper not found" || message === "User not found") {
        status = 404;
      } else if (message === "No camera-ready files uploaded for this paper") {
        status = 400;
      } else if (message.includes("Only admin or chair")) {
        status = 403;
      }

      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /camera-ready-approval/papers/:paperId/status
   * Get camera-ready status for a paper
   * Requires: Access Token + (Admin or Chair of the conference)
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;

      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
        });
        return;
      }

      const result = await cameraReadyApprovalService.getStatus(paperId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to get camera-ready status";

      const status = message === "Paper not found" ? 404 : 500;

      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};

