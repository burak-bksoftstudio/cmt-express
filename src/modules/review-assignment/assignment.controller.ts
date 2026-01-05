import { Request, Response } from "express";
import { assignmentService } from "./assignment.service";
import { ReviewStatus } from "../../generated/prisma/enums";

export const assignmentController = {
  /**
   * POST /assignments/create
   * Create a new review assignment
   */
  async createAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { paperId, reviewerId, dueDate } = req.body;

      if (!paperId || !reviewerId) {
        res.status(400).json({
          success: false,
          message: "Paper ID and reviewer ID are required",
        });
        return;
      }

      const assignment = await assignmentService.createAssignment(
        paperId,
        reviewerId,
        dueDate ? new Date(dueDate) : undefined
      );

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        data: assignment,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create assignment";
      let status = 400;
      if (message.includes("not found")) status = 404;
      if (message.includes("already exists")) status = 409;
      res.status(status).json({ success: false, message });
    }
  },

  /**
   * DELETE /assignments/:assignmentId
   * Delete an assignment
   */
  async deleteAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;

      if (!assignmentId) {
        res.status(400).json({
          success: false,
          message: "Assignment ID is required",
        });
        return;
      }

      const result = await assignmentService.deleteAssignment(assignmentId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete assignment";
      const status = message.includes("not found") ? 404 : 400;
      res.status(status).json({ success: false, message });
    }
  },

  /**
   * GET /assignments/papers/:paperId
   * Get assignments for a paper
   */
  async getAssignmentsForPaper(req: Request, res: Response): Promise<void> {
    try {
      const { paperId } = req.params;

      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "Paper ID is required",
        });
        return;
      }

      const assignments = await assignmentService.getAssignmentsForPaper(paperId);

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get assignments";
      res.status(500).json({ success: false, message });
    }
  },

  /**
   * GET /assignments/my
   * Get reviewer's assigned papers
   */
  async getMyAssignments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const assignments = await assignmentService.getMyAssignments(userId);

      res.status(200).json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get assignments";
      res.status(500).json({ success: false, message });
    }
  },

  /**
   * PATCH /assignments/:assignmentId/status
   * Update assignment status
   */
  async updateAssignmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const { status } = req.body;

      if (!assignmentId) {
        res.status(400).json({
          success: false,
          message: "Assignment ID is required",
        });
        return;
      }

      const validStatuses: ReviewStatus[] = ["NOT_STARTED", "DRAFT", "SUBMITTED"];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: "Invalid status. Must be one of: NOT_STARTED, DRAFT, SUBMITTED",
        });
        return;
      }

      const assignment = await assignmentService.updateAssignmentStatus(
        assignmentId,
        status as ReviewStatus
      );

      res.status(200).json({
        success: true,
        message: "Assignment status updated",
        data: assignment,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update status";
      res.status(500).json({ success: false, message });
    }
  },

  /**
   * POST /assignments/auto/:conferenceId
   * Auto-assign reviewers for a conference
   */
  async autoAssign(req: Request, res: Response): Promise<void> {
    try {
      const { conferenceId } = req.params;
      const { targetReviewersPerPaper } = req.body;

      if (!conferenceId) {
        res.status(400).json({
          success: false,
          message: "Conference ID is required",
        });
        return;
      }

      const result = await assignmentService.autoAssignReviewers(
        conferenceId,
        targetReviewersPerPaper || 3
      );

      res.status(200).json({
        success: true,
        message: `Auto-assignment completed. ${result.totalAssigned} assignments created.`,
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auto-assignment failed";
      res.status(500).json({ success: false, message });
    }
  },

  /**
   * GET /assignments/conferences/:conferenceId/stats
   * Get assignment statistics for a conference
   */
  async getConferenceStats(req: Request, res: Response): Promise<void> {
    try {
      const { conferenceId } = req.params;

      if (!conferenceId) {
        res.status(400).json({
          success: false,
          message: "Conference ID is required",
        });
        return;
      }

      const stats = await assignmentService.getConferenceAssignmentStats(conferenceId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get stats";
      res.status(500).json({ success: false, message });
    }
  },
};
