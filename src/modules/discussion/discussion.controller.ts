import { Request, Response } from "express";
import { discussionService } from "./discussion.service";

export const discussionController = {
  /**
   * GET /discussions/paper/:paperId
   * Get or create discussion for a paper
   */
  async getDiscussionByPaper(req: Request, res: Response): Promise<void> {
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

      const discussion = await discussionService.getDiscussionByPaperId(
        paperId,
        userId
      );

      res.status(200).json({
        success: true,
        data: discussion,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get discussion";
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
   * POST /discussions/:discussionId/messages
   * Add a message to a discussion
   */
  async addMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { discussionId } = req.params;
      const { message, isInternal } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!discussionId) {
        res.status(400).json({
          success: false,
          message: "Discussion ID is required",
        });
        return;
      }

      if (!message || !message.trim()) {
        res.status(400).json({
          success: false,
          message: "Message is required",
        });
        return;
      }

      const newMessage = await discussionService.addMessage({
        discussionId,
        userId,
        message: message.trim(),
        isInternal: isInternal !== undefined ? isInternal : true,
      });

      res.status(201).json({
        success: true,
        message: "Message added successfully",
        data: newMessage,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add message";
      let status = 400;
      if (message.includes("not found")) status = 404;
      if (message.includes("Only META_REVIEWER")) status = 403;
      if (message.includes("closed")) status = 400;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /discussions/:discussionId/close
   * Close a discussion
   */
  async closeDiscussion(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { discussionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!discussionId) {
        res.status(400).json({
          success: false,
          message: "Discussion ID is required",
        });
        return;
      }

      const discussion = await discussionService.closeDiscussion(
        discussionId,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Discussion closed successfully",
        data: discussion,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to close discussion";
      let status = 400;
      if (message.includes("not found")) status = 404;
      if (message.includes("Only chair")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /discussions/:discussionId/reopen
   * Reopen a discussion
   */
  async reopenDiscussion(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { discussionId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!discussionId) {
        res.status(400).json({
          success: false,
          message: "Discussion ID is required",
        });
        return;
      }

      const discussion = await discussionService.reopenDiscussion(
        discussionId,
        userId
      );

      res.status(200).json({
        success: true,
        message: "Discussion reopened successfully",
        data: discussion,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reopen discussion";
      let status = 400;
      if (message.includes("not found")) status = 404;
      if (message.includes("Only chair")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /discussions/conference/:conferenceId
   * Get all discussions for a conference
   */
  async getDiscussionsByConference(
    req: Request,
    res: Response
  ): Promise<void> {
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

      const discussions = await discussionService.getDiscussionsByConference(
        conferenceId,
        userId
      );

      res.status(200).json({
        success: true,
        data: discussions,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get discussions";
      let status = 500;
      if (message.includes("Only chair")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * DELETE /discussions/messages/:messageId
   * Delete a message
   */
  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { messageId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      if (!messageId) {
        res.status(400).json({
          success: false,
          message: "Message ID is required",
        });
        return;
      }

      const result = await discussionService.deleteMessage(messageId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete message";
      let status = 400;
      if (message.includes("not found")) status = 404;
      if (message.includes("Only the message author")) status = 403;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};
