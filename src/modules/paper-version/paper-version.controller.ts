import { Request, Response } from "express";
import { paperVersionService } from "./paper-version.service";

export class PaperVersionController {
  /**
   * Get all versions for a paper
   * GET /papers/:paperId/versions
   */
  async getVersions(req: Request, res: Response) {
    try {
      const { paperId } = req.params;

      const versions = await paperVersionService.getVersions(paperId);

      return res.json({
        success: true,
        data: versions,
      });
    } catch (error: any) {
      console.error("Error fetching versions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch versions",
        error: error.message,
      });
    }
  }

  /**
   * Get a specific version
   * GET /papers/:paperId/versions/:version
   */
  async getVersion(req: Request, res: Response) {
    try {
      const { paperId, version } = req.params;

      const versionData = await paperVersionService.getVersion(
        paperId,
        parseInt(version)
      );

      if (!versionData) {
        return res.status(404).json({
          success: false,
          message: "Version not found",
        });
      }

      return res.json({
        success: true,
        data: versionData,
      });
    } catch (error: any) {
      console.error("Error fetching version:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch version",
        error: error.message,
      });
    }
  }

  /**
   * Get the latest version
   * GET /papers/:paperId/versions/latest
   */
  async getLatestVersion(req: Request, res: Response) {
    try {
      const { paperId } = req.params;

      const version = await paperVersionService.getLatestVersion(paperId);

      if (!version) {
        return res.status(404).json({
          success: false,
          message: "No versions found for this paper",
        });
      }

      return res.json({
        success: true,
        data: version,
      });
    } catch (error: any) {
      console.error("Error fetching latest version:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch latest version",
        error: error.message,
      });
    }
  }
}

export const paperVersionController = new PaperVersionController();
