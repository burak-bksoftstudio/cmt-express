import { Request, Response } from "express";
import { paperService } from "./paper.service";
import { prisma } from "../../config/prisma";

export const paperController = {
  /**
   * POST /papers
   * Create a new paper
   */
  async createPaper(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { conferenceId, trackId, title, abstract, keywords } = req.body;

      if (!conferenceId) {
        res.status(400).json({ success: false, message: "conferenceId is required" });
        return;
      }

      if (!title) {
        res.status(400).json({ success: false, message: "title is required" });
        return;
      }

      const paper = await paperService.createPaper(userId, {
        conferenceId,
        trackId,
        title,
        abstract,
        keywords,
      });

      res.status(201).json({
        success: true,
        message: "Paper created successfully",
        data: paper,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create paper";
      let status = 400;
      if (message === "Conference not found" || message === "Track not found") {
        status = 404;
      } else if (message === "Submission deadline has passed") {
        status = 403;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /papers/:paperId/upload
   * Upload a file to an existing paper
   */
  async uploadPaperFile(req: Request, res: Response) {
    try {
      const { paperId } = req.params;
      const userId = req.user?.userId;

      if (!paperId) {
        res.status(400).json({ success: false, message: "paperId is required" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: "File is required" });
        return;
      }

      const { buffer, originalname, mimetype } = req.file;

      const result = await paperService.uploadPaperFile(
        paperId,
        buffer,
        originalname,
        mimetype,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Paper file uploaded successfully",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      const status = message === "Paper not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /papers/:paperId
   * Get a paper by ID with all related data
   */
  async getPaperById(req: Request, res: Response) {
    try {
      const { paperId } = req.params;
      const userId = req.user?.userId;

      if (!paperId) {
        res.status(400).json({
          success: false,
          message: "paperId is required",
        });
        return;
      }

      // Check if user has Chair/Admin access for this paper
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      let isChairOrAdmin = user?.isAdmin || false;

      // If not admin, check if user is chair of the conference
      if (!isChairOrAdmin && userId) {
        const paper = await prisma.paper.findUnique({
          where: { id: paperId },
          select: { conferenceId: true },
        });

        if (paper) {
          const { getUserConferenceRole } = await import("../auth/auth.middleware");
          const role = await getUserConferenceRole(userId, paper.conferenceId);
          isChairOrAdmin = role.isChair;
        }
      }

      const paper = await paperService.getPaperById(paperId, userId, isChairOrAdmin);

      res.status(200).json({
        success: true,
        data: paper,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get paper";
      const status = message === "Paper not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /papers/my
   * Get current user's papers
   */
  async getMyPapers(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const conferenceId = req.query.conferenceId as string | undefined;
      const papers = await paperService.getMyPapers(userId, conferenceId);

      res.status(200).json({
        success: true,
        data: papers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get papers";
      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /papers
   * Get all papers (admin or chair of specified conference)
   */
  async getAllPapers(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const conferenceId = req.query.conferenceId as string | undefined;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      const isAdmin = user?.isAdmin || false;

      // If not admin, must provide conferenceId and be chair of that conference
      if (!isAdmin) {
        if (!conferenceId) {
          res.status(403).json({
            success: false,
            message: "Conference ID required for non-admin users",
          });
          return;
        }

        // Check if user is chair of this conference
        const { getUserConferenceRole } = await import("../auth/auth.middleware");
        const role = await getUserConferenceRole(userId, conferenceId);

        if (!role.isChair) {
          res.status(403).json({
            success: false,
            message: "Access denied. Chair privileges required.",
          });
          return;
        }
      }

      const papers = await paperService.getAllPapers(conferenceId);

      res.status(200).json({
        success: true,
        data: papers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get papers";
      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * PATCH /papers/:paperId
   * Update paper metadata (title, abstract, keywords)
   * Only allowed before review starts and before deadline
   */
  async updatePaper(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { paperId } = req.params;
      const { title, abstract, keywords, trackId } = req.body;

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

      const paper = await paperService.updatePaper(paperId, userId, {
        title,
        abstract,
        keywords,
        trackId,
      });

      res.status(200).json({
        success: true,
        message: "Paper updated successfully",
        data: paper,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update paper";
      let status = 400;

      if (message === "Paper not found") {
        status = 404;
      } else if (message.includes("Only paper authors")) {
        status = 403;
      } else if (message.includes("Cannot edit paper")) {
        status = 403;
      } else if (message.includes("deadline")) {
        status = 403;
      }

      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /papers/:paperId/authors
   * Add authors to a paper
   */
  async addAuthors(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { paperId } = req.params;
      const { authors } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!paperId) {
        res.status(400).json({ success: false, message: "paperId is required" });
        return;
      }

      if (!authors || !Array.isArray(authors)) {
        res.status(400).json({ success: false, message: "authors array is required" });
        return;
      }

      const paper = await paperService.addAuthors(paperId, userId, authors);

      res.status(200).json({
        success: true,
        message: "Authors added successfully",
        data: paper,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add authors";
      let status = 400;
      if (message === "Paper not found") {
        status = 404;
      } else if (message.includes("not authorized")) {
        status = 403;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * DELETE /papers/:paperId/files/:fileId
   * Delete a paper file
   * Only authors can delete files before review assignments
   */
  async deleteFile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { paperId, fileId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!paperId || !fileId) {
        res.status(400).json({ success: false, message: "paperId and fileId are required" });
        return;
      }

      const result = await paperService.deletePaperFile(paperId, fileId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete file";
      let status = 500;
      if (message === "Paper not found" || message === "File not found") {
        status = 404;
      } else if (message.includes("Only paper authors") || message.includes("Cannot delete")) {
        status = 403;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /papers/:paperId/download
   * Download paper file with presigned URL
   * Authorized users: authors, reviewers assigned to paper, conference chairs, admins
   */
  async downloadPaper(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { paperId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!paperId) {
        res.status(400).json({ success: false, message: "paperId is required" });
        return;
      }

      const downloadUrl = await paperService.generateDownloadUrl(paperId, userId);

      res.status(200).json({
        success: true,
        data: { downloadUrl },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate download URL";
      let status = 500;
      if (message === "Paper not found") {
        status = 404;
      } else if (message === "No file uploaded for this paper") {
        status = 404;
      } else if (message === "Access denied") {
        status = 403;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};
