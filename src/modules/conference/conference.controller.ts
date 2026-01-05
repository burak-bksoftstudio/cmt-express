import { Request, Response } from "express";
import { conferenceService } from "./conference.service";

export const conferenceController = {
  /**
   * POST /conferences
   * Create a new conference (Admin only)
   */
  async createConference(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, location, startDate, endDate } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: "Conference name is required",
        });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
        return;
      }

      const conference = await conferenceService.createConference({
        name,
        description,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      res.status(201).json({
        success: true,
        message: "Conference created successfully",
        data: conference,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create conference";
      res.status(400).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conferences
   * Get all conferences (public)
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const conferences = await conferenceService.getAllConferences();

      res.status(200).json({
        success: true,
        data: conferences,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch conferences";
      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conferences/my
   * Get user's conferences (requires token)
   * - Admin sees all
   * - Chair sees only their conferences
   */
  async getMyConferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const conferences = await conferenceService.getMyConferences(userId);

      res.status(200).json({
        success: true,
        data: conferences,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch conferences";
      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conferences/:id
   * Get a single conference (public)
   */
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const conference = await conferenceService.getConferenceById(id);

      res.status(200).json({
        success: true,
        data: conference,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch conference";
      const status = message === "Conference not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * PUT /conferences/:id
   * Update a conference (Admin or Chair)
   */
  async updateConference(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { name, description, location, startDate, endDate } = req.body;

      const conference = await conferenceService.updateConference(id, userId, {
        name,
        description,
        location,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      res.status(200).json({
        success: true,
        message: "Conference updated successfully",
        data: conference,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update conference";
      const status = message === "Conference not found" ? 404 : 400;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conferences/:id/assign-chair
   * Assign a chair to a conference (Admin only)
   */
  async assignChair(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "userId is required in request body",
        });
        return;
      }

      const result = await conferenceService.assignChair(id, userId);

      res.status(200).json({
        success: true,
        message: "Chair assigned successfully",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assign chair";
      const status = message.includes("not found") ? 404 : 400;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conferences/:id/join
   * User joins a conference as "member"
   */
  async joinConference(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await conferenceService.joinConference(userId, id);

      res.status(201).json({
        success: true,
        message: "Successfully joined conference",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join conference";
      let status = 400;
      if (message === "Conference not found" || message === "User not found") {
        status = 404;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conferences/:id/add-user
   * Chair adds a user to conference as "member"
   */
  async addUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "userId is required in request body",
        });
        return;
      }

      const result = await conferenceService.addUserToConference(id, userId);

      res.status(201).json({
        success: true,
        message: "User added to conference successfully",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add user";
      let status = 400;
      if (message.includes("not found")) {
        status = 404;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conferences/:id/assign-reviewer
   * Chair promotes a member to "reviewer" role
   */
  async assignReviewer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "userId is required in request body",
        });
        return;
      }

      const result = await conferenceService.assignReviewerRole(id, userId);

      res.status(201).json({
        success: true,
        message: "Reviewer role assigned successfully",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to assign reviewer";
      let status = 400;
      if (message.includes("not found")) {
        status = 404;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conferences/:id/members
   * Get all members of a conference
   */
  async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const members = await conferenceService.getConferenceMembers(id);

      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get members";
      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conferences/:id/tracks
   * Get all tracks for a conference
   */
  async getTracks(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tracks = await conferenceService.getConferenceTracks(id);

      res.status(200).json({
        success: true,
        data: tracks,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get tracks";
      const status = message === "Conference not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conferences/:id/tracks
   * Create a new track for a conference
   */
  async createTrack(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: "Track name is required",
        });
        return;
      }

      const track = await conferenceService.createTrack(id, { name, description });

      res.status(201).json({
        success: true,
        message: "Track created successfully",
        data: track,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create track";
      let status = 400;
      if (message === "Conference not found") {
        status = 404;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * DELETE /conferences/:id/tracks/:trackId
   * Delete a track from a conference
   */
  async deleteTrack(req: Request, res: Response): Promise<void> {
    try {
      const { id, trackId } = req.params;

      const result = await conferenceService.deleteTrack(id, trackId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete track";
      let status = 400;
      if (message === "Track not found") {
        status = 404;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conferences/:id/archive
   * Archive a conference (Admin or Chair)
   */
  async archiveConference(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const conference = await conferenceService.archiveConference(id);

      res.status(200).json({
        success: true,
        message: "Conference archived successfully",
        data: conference,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to archive conference";
      let status = 400;
      if (message === "Conference not found") {
        status = 404;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conferences/:id/unarchive
   * Unarchive a conference (Admin or Chair)
   */
  async unarchiveConference(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const conference = await conferenceService.unarchiveConference(id);

      res.status(200).json({
        success: true,
        message: "Conference unarchived successfully",
        data: conference,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to unarchive conference";
      let status = 400;
      if (message === "Conference not found") {
        status = 404;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * PUT /conferences/:id/settings
   * Update conference settings (Admin or Chair)
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { submissionDeadline, reviewDeadline, maxReviewersPerPaper, assignmentTimeoutDays } = req.body;

      const settings = await conferenceService.updateConferenceSettings(id, {
        submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : undefined,
        reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : undefined,
        maxReviewersPerPaper: maxReviewersPerPaper ? Number(maxReviewersPerPaper) : undefined,
        assignmentTimeoutDays: assignmentTimeoutDays ? Number(assignmentTimeoutDays) : undefined,
      });

      res.status(200).json({
        success: true,
        message: "Conference settings updated successfully",
        data: settings,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update settings";
      let status = 400;
      if (message === "Conference not found") {
        status = 404;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};
