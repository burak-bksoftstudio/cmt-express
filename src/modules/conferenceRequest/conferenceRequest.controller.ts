import { Request, Response } from "express";
import { conferenceRequestService } from "./conferenceRequest.service";

export const conferenceRequestController = {
  /**
   * POST /conference-requests
   * Create a new conference request
   */
  async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.user?.userId;

      if (!requesterId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { title, description, startDate, endDate } = req.body;

      if (!title) {
        res.status(400).json({
          success: false,
          message: "Title is required",
        });
        return;
      }

      const request = await conferenceRequestService.createRequest(requesterId, {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });

      res.status(201).json({
        success: true,
        message: "Conference request created successfully",
        data: request,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create request";
      res.status(400).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conference-requests/my
   * Get my conference requests
   */
  async getMyRequests(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.user?.userId;

      if (!requesterId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const requests = await conferenceRequestService.getRequestsByUser(requesterId);

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch your requests";
      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conference-requests
   * Get all conference requests (admin only)
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const requests = await conferenceRequestService.getAllRequests();

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch requests";
      res.status(500).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conference-requests/:id/approve
   * Approve a conference request (admin only)
   * Body: { price?: number, currency?: string }
   */
  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.userId;
      const { price, currency } = req.body || {};

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await conferenceRequestService.approveRequest(
        id,
        adminId,
        price,
        currency
      );

      res.status(200).json({
        success: true,
        message: "Conference request approved successfully",
        data: result,
      });
    } catch (error) {
      console.error("❌ Approve request error:", error);
      const message = error instanceof Error ? error.message : "Failed to approve request";
      res.status(400).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conference-requests/:id/reject
   * Reject a conference request (admin only)
   */
  async reject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.userId;
      const { comment } = req.body;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await conferenceRequestService.rejectRequest(id, adminId, comment);

      res.status(200).json({
        success: true,
        message: "Conference request rejected",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject request";
      res.status(400).json({
        success: false,
        message,
      });
    }
  },
};

