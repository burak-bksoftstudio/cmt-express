import { Request, Response } from "express";
import { decisionService } from "./decision.service";

export const decisionController = {
  /**
   * POST /decisions/papers/:paperId
   * Make a decision on a paper
   *
   * Requires: Admin or Chair of the paper's conference
   *
   * Request Body:
   * - finalDecision: "accept" | "reject" (required)
   * - comment: string (optional)
   *
   * Response:
   * {
   *   success: true,
   *   message: "Decision saved",
   *   data: {
   *     paper: { id, title, status, createdAt, conference },
   *     decision: { id, paperId, decision, finalDecision, comment, averageScore, ... },
   *     stage: "submitted" | "under_review" | "decided" | "camera_ready",
   *     timeline: [{ type, timestamp, description, metadata }],
   *     reviewStats: { scores, averageScore, averageConfidence, reviewCount, ... },
   *     decidedBy: { id, email, firstName, lastName }
   *   }
   * }
   */
  async makeDecision(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;
      const userId = req.user?.userId;

      // Authentication check
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      // Validate paperId
      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
        });
        return;
      }

      const { finalDecision, comment } = req.body;

      // Validate finalDecision presence
      if (!finalDecision) {
        res.status(400).json({
          success: false,
          message: "finalDecision is required",
        });
        return;
      }

      // Validate finalDecision value
      if (finalDecision !== "accept" && finalDecision !== "reject") {
        res.status(400).json({
          success: false,
          message: "finalDecision must be 'accept' or 'reject'",
        });
        return;
      }

      // Make the decision
      const result = await decisionService.makeDecision(paperId, userId, {
        finalDecision,
        comment,
      });

      res.status(201).json({
        success: true,
        message: "Decision saved",
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to make decision";

      // Map error messages to appropriate HTTP status codes
      let status = 500;
      if (message === "Paper not found" || message === "User not found") {
        status = 404;
      } else if (message.includes("Only the chair")) {
        status = 403;
      } else if (
        message === "No reviews submitted for this paper" ||
        message.includes("finalDecision must be") ||
        message === "Failed to create decision"
      ) {
        status = 400;
      }

      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /decisions/papers/:paperId
   * Get the decision for a paper with enhanced UI-ready data
   *
   * Response:
   * {
   *   success: true,
   *   data: {
   *     paper: { id, title, status, createdAt, conference },
   *     decision: { id, paperId, decision, finalDecision, comment, averageScore, ... },
   *     stage: "submitted" | "under_review" | "decided" | "camera_ready",
   *     timeline: [{ type, timestamp, description, metadata }],
   *     reviewStats: { scores, averageScore, averageConfidence, reviewCount, ... },
   *     decidedBy: null | { id, email, firstName, lastName }
   *   }
   * }
   */
  async getDecision(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;

      // Validate paperId
      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
        });
        return;
      }

      const result = await decisionService.getDecisionByPaperId(paperId);

      // Handle case where no decision exists
      if (!result) {
        res.status(404).json({
          success: false,
          message: "No decision found for this paper",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get decision";

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

  /**
   * GET /decisions/papers/:paperId/info
   * Get paper info with decision details (works even without a decision)
   *
   * This endpoint is useful for the Paper Detail > Decision Section UI
   * as it provides stage, timeline, and review stats regardless of
   * whether a decision has been made.
   *
   * DOUBLE-BLIND: Authors will receive anonymized data (no reviewer info, no scores)
   *
   * Response:
   * {
   *   success: true,
   *   data: {
   *     paper: { id, title, status, createdAt, conference },
   *     decision: null | { ... },
   *     stage: "submitted" | "under_review" | "decided" | "camera_ready",
   *     timeline: [{ type, timestamp, description, metadata }],
   *     reviewStats: { scores, averageScore, averageConfidence, reviewCount, ... },
   *     hasDecision: boolean
   *   }
   * }
   */
  async getPaperDecisionInfo(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;
      const userId = req.user?.userId;

      // Validate paperId
      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
        });
        return;
      }

      const result = await decisionService.getPaperDecisionInfo(paperId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get paper decision info";

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
