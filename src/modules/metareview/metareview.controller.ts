import { Request, Response } from "express";
import { metareviewService } from "./metareview.service";

export const metareviewController = {
  /**
   * POST /metareviews
   * Create a new metareview
   */
  async createMetareview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const {
        paperId,
        summary,
        strengths,
        weaknesses,
        recommendation,
        confidence,
        reviewConsensus,
        disagreementNote,
      } = req.body;

      // Validation
      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "Paper ID is required",
        });
        return;
      }

      if (!summary || !strengths || !weaknesses || !recommendation || !confidence) {
        res.status(400).json({
          success: false,
          message: "All required fields must be provided",
        });
        return;
      }

      if (!["ACCEPT", "REJECT", "BORDERLINE"].includes(recommendation)) {
        res.status(400).json({
          success: false,
          message: "Recommendation must be ACCEPT, REJECT, or BORDERLINE",
        });
        return;
      }

      const metareview = await metareviewService.createMetareview({
        paperId,
        metaReviewerId: userId,
        summary,
        strengths,
        weaknesses,
        recommendation,
        confidence: parseInt(confidence),
        reviewConsensus: reviewConsensus !== undefined ? reviewConsensus : true,
        disagreementNote,
      });

      res.status(201).json({
        success: true,
        message: "Metareview created successfully",
        data: metareview,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create metareview";
      let status = 400;
      if (message.includes("not found")) status = 404;
      if (message.includes("Access denied") || message.includes("must have")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * PUT /metareviews/:id
   * Update a metareview
   */
  async updateMetareview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Metareview ID is required",
        });
        return;
      }

      const {
        summary,
        strengths,
        weaknesses,
        recommendation,
        confidence,
        reviewConsensus,
        disagreementNote,
      } = req.body;

      const updateData: any = {};
      if (summary !== undefined) updateData.summary = summary;
      if (strengths !== undefined) updateData.strengths = strengths;
      if (weaknesses !== undefined) updateData.weaknesses = weaknesses;
      if (recommendation !== undefined) {
        if (!["ACCEPT", "REJECT", "BORDERLINE"].includes(recommendation)) {
          res.status(400).json({
            success: false,
            message: "Recommendation must be ACCEPT, REJECT, or BORDERLINE",
          });
          return;
        }
        updateData.recommendation = recommendation;
      }
      if (confidence !== undefined) updateData.confidence = parseInt(confidence);
      if (reviewConsensus !== undefined) updateData.reviewConsensus = reviewConsensus;
      if (disagreementNote !== undefined) updateData.disagreementNote = disagreementNote;

      const metareview = await metareviewService.updateMetareview(id, userId, updateData);

      res.status(200).json({
        success: true,
        message: "Metareview updated successfully",
        data: metareview,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update metareview";
      let status = 400;
      if (message.includes("not found")) status = 404;
      if (message.includes("Only the")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /metareviews/:id/submit
   * Submit a metareview
   */
  async submitMetareview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Metareview ID is required",
        });
        return;
      }

      const metareview = await metareviewService.submitMetareview(id, userId);

      res.status(200).json({
        success: true,
        message: "Metareview submitted successfully",
        data: metareview,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit metareview";
      let status = 400;
      if (message.includes("not found")) status = 404;
      if (message.includes("Only the")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /metareviews/paper/:paperId
   * Get metareview for a specific paper
   */
  async getMetareviewByPaper(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { paperId } = req.params;

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
          message: "Paper ID is required",
        });
        return;
      }

      const metareview = await metareviewService.getMetareviewByPaperId(paperId, userId);

      res.status(200).json({
        success: true,
        data: metareview,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get metareview";
      let status = 500;
      if (message.includes("not found")) status = 404;
      if (message.includes("Access denied")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /metareviews/conference/:conferenceId
   * Get all metareviews for a conference
   */
  async getMetareviewsByConference(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { conferenceId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!conferenceId) {
        res.status(400).json({
          success: false,
          message: "Conference ID is required",
        });
        return;
      }

      const metareviews = await metareviewService.getMetareviewsByConference(
        conferenceId,
        userId
      );

      res.status(200).json({
        success: true,
        data: metareviews,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get metareviews";
      let status = 500;
      if (message.includes("Only chair")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /metareviews/my
   * Get metareviews assigned to the current user
   */
  async getMyMetareviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { conferenceId } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const metareviews = await metareviewService.getMyMetareviews(
        userId,
        conferenceId as string | undefined
      );

      res.status(200).json({
        success: true,
        data: metareviews,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get metareviews";
      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * DELETE /metareviews/:id
   * Delete a metareview
   */
  async deleteMetareview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Metareview ID is required",
        });
        return;
      }

      const result = await metareviewService.deleteMetareview(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete metareview";
      let status = 400;
      if (message.includes("not found")) status = 404;
      if (message.includes("Access denied")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};
