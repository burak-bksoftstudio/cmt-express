import { Request, Response } from "express";
import { cameraReadyService } from "./cameraReady.service";

export const cameraReadyController = {
  /**
   * POST /camera-ready/papers/:paperId/upload
   * Upload camera-ready file for an accepted paper
   * Requires: Access Token (user must be author)
   */
  async upload(req: Request, res: Response): Promise<void> {
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

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "File is required",
        });
        return;
      }

      const { buffer, originalname, mimetype } = req.file;

      const file = await cameraReadyService.uploadCameraReady(paperId, userId, {
        buffer,
        originalname,
        mimetype,
      });

      res.status(201).json({
        success: true,
        message: "Camera-ready uploaded",
        data: file,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload camera-ready";

      let status = 500;
      if (message === "Paper not found") {
        status = 404;
      } else if (
        message === "Only authors can upload camera-ready files" ||
        message === "Camera-ready can only be uploaded for accepted papers"
      ) {
        status = 403;
      }

      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /camera-ready/papers/:paperId
   * Get camera-ready files for a paper
   */
  async getFiles(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;

      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
        });
        return;
      }

      const files = await cameraReadyService.getCameraReadyFiles(paperId);

      res.status(200).json({
        success: true,
        data: files,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get camera-ready files";

      const status = message === "Paper not found" ? 404 : 500;

      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};

