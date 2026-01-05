import { Request, Response } from "express";
import { biddingService } from "./bidding.service";
import { BidValue } from "../../generated/prisma/enums";

export const biddingController = {
  /**
   * POST /bids/papers/:paperId
   * Submit or update a bid for a paper
   */
  async submitBid(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { paperId } = req.params;
      const { bid } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!paperId) {
        res.status(400).json({ success: false, message: "Paper ID is required" });
        return;
      }

      // Validate bid value
      const validBids: BidValue[] = ["YES", "MAYBE", "NO", "CONFLICT"];
      if (!bid || !validBids.includes(bid)) {
        res.status(400).json({
          success: false,
          message: "Invalid bid value. Must be one of: YES, MAYBE, NO, CONFLICT",
        });
        return;
      }

      const result = await biddingService.submitBid(paperId, userId, bid as BidValue);

      res.status(200).json({
        success: true,
        message: "Bid submitted successfully",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit bid";
      const status = message.includes("not found") ? 404 : 400;
      res.status(status).json({ success: false, message });
    }
  },

  /**
   * GET /bids/papers/:paperId
   * Get reviewer's bid for a specific paper
   */
  async getBid(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { paperId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!paperId) {
        res.status(400).json({ success: false, message: "Paper ID is required" });
        return;
      }

      const bid = await biddingService.getBid(paperId, userId);

      res.status(200).json({
        success: true,
        data: bid,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get bid";
      res.status(500).json({ success: false, message });
    }
  },

  /**
   * GET /bids/my
   * Get all bids made by the current reviewer
   */
  async getMyBids(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const bids = await biddingService.getMyBids(userId);

      res.status(200).json({
        success: true,
        data: bids,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get bids";
      res.status(500).json({ success: false, message });
    }
  },

  /**
   * GET /bids/conferences/:conferenceId
   * Get bidding matrix for a conference (Chair/Admin only)
   */
  async getConferenceBiddingMatrix(req: Request, res: Response): Promise<void> {
    try {
      const { conferenceId } = req.params;

      if (!conferenceId) {
        res.status(400).json({ success: false, message: "Conference ID is required" });
        return;
      }

      const matrix = await biddingService.getConferenceBiddingMatrix(conferenceId);

      res.status(200).json({
        success: true,
        data: matrix,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get bidding matrix";
      res.status(500).json({ success: false, message });
    }
  },

  /**
   * GET /bids/conferences/:conferenceId/papers
   * Get papers available for bidding
   */
  async getPapersForBidding(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { conferenceId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!conferenceId) {
        res.status(400).json({ success: false, message: "Conference ID is required" });
        return;
      }

      const papers = await biddingService.getPapersForBidding(conferenceId, userId);

      res.status(200).json({
        success: true,
        data: papers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get papers";
      res.status(500).json({ success: false, message });
    }
  },
};
