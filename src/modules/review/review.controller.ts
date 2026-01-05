import { Request, Response } from "express";
import { reviewService } from "./review.service";
import { prisma } from "../../config/prisma";
import { getUserConferenceRole } from "../auth/auth.middleware";

export const reviewController = {
  /**
   * GET /reviews/:id
   * Get review by assignment ID (for ReviewDetailPage)
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      if (!id) {
        res.status(400).json({ success: false, message: "id is required" });
        return;
      }

      const review = await reviewService.getReviewById(id, userId);

      res.status(200).json({ success: true, data: review });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get review";
      const status =
        message === "Assignment not found" ? 404 : message === "Forbidden" ? 403 : 500;
      res.status(status).json({ success: false, message });
    }
  },

  /**
   * GET /reviews/assignments/:assignmentId
   * Get assignment + review details (role-checked)
   */
  async getAssignment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { assignmentId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      if (!assignmentId) {
        res.status(400).json({ success: false, message: "assignmentId is required" });
        return;
      }

      const assignment = await reviewService.getAssignment(assignmentId, userId);

      res.status(200).json({ success: true, data: assignment });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get assignment";
      const status =
        message === "Assignment not found" ? 404 : message === "Forbidden" ? 403 : 500;
      res.status(status).json({ success: false, message });
    }
  },

  /**
   * POST /reviews/:assignmentId/draft
   * Save draft review
   */
  async saveDraft(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { assignmentId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      if (!assignmentId) {
        res.status(400).json({ success: false, message: "assignmentId is required" });
        return;
      }

      const result = await reviewService.saveDraft(assignmentId, userId, req.body || {});

      res.status(200).json({
        success: true,
        message: "Draft saved",
        data: result.review,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save draft";
      const status =
        message === "Assignment not found"
          ? 404
          : message === "Forbidden"
          ? 403
          : 400;
      res.status(status).json({ success: false, message });
    }
  },

  /**
   * POST /reviews/:assignmentId/submit
   * Submit final review
   */
  async submitReview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { assignmentId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      if (!assignmentId) {
        res.status(400).json({ success: false, message: "assignmentId is required" });
        return;
      }

      const result = await reviewService.submitReview(assignmentId, userId, req.body || {});

      res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit review";
      const status =
        message === "Assignment not found"
          ? 404
          : message === "Forbidden"
          ? 403
          : 400;
      res.status(status).json({ success: false, message });
    }
  },

  /**
   * GET /reviews/papers/:paperId/reviews
   * Get reviews for a paper (anonymized for non-chair/admin users)
   */
  async getPaperReviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { paperId } = req.params;

      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
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
          // Get paper's conference to check chair status
          const paper = await prisma.paper.findUnique({
            where: { id: paperId },
            select: { conferenceId: true },
          });

          if (paper) {
            const role = await getUserConferenceRole(userId, paper.conferenceId);
            isChairOrAdmin = role.isChair;
          }
        }
      }

      const reviews = await reviewService.getReviewsByPaperId(paperId, userId, isChairOrAdmin);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get reviews";

      const status = message === "Paper not found" ? 404 :
                     message.includes("Authors cannot") ? 403 : 500;

      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};

