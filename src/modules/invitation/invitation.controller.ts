import { Request, Response } from "express";
import { invitationService } from "./invitation.service";
import { MemberRole } from "../../generated/prisma/enums";

export class InvitationController {
  /**
   * POST /invitations
   * Send an invitation to join a conference
   */
  async sendInvitation(req: Request, res: Response): Promise<void> {
    try {
      const inviterId = req.user?.userId;
      if (!inviterId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { conferenceId, inviteeEmail, role, message } = req.body;

      if (!conferenceId || !inviteeEmail || !role) {
        res.status(400).json({
          success: false,
          message: "conferenceId, inviteeEmail, and role are required",
        });
        return;
      }

      // Validate role
      if (!["CHAIR", "REVIEWER", "AUTHOR"].includes(role)) {
        res.status(400).json({
          success: false,
          message: "Invalid role. Must be CHAIR, REVIEWER, or AUTHOR",
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteeEmail)) {
        res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
        return;
      }

      const invitation = await invitationService.sendInvitation(
        conferenceId,
        inviterId,
        inviteeEmail,
        role as MemberRole,
        message
      );

      res.status(201).json({
        success: true,
        message: "Invitation sent successfully",
        data: invitation,
      });
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to send invitation",
      });
    }
  }

  /**
   * GET /invitations/my
   * Get my pending invitations
   */
  async getMyInvitations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Get user email
      const { prisma } = await import("../../config/prisma");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      const status = req.query.status as string | undefined;
      const invitations = await invitationService.getInvitationsByEmail(
        user.email,
        status as any
      );

      res.status(200).json({
        success: true,
        data: invitations,
      });
    } catch (error: any) {
      console.error("Error getting invitations:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to get invitations",
      });
    }
  }

  /**
   * POST /invitations/:id/accept
   * Accept an invitation
   */
  async acceptInvitation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      // Get user email
      const { prisma } = await import("../../config/prisma");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      const result = await invitationService.acceptInvitation(id, user.email);

      res.status(200).json({
        success: true,
        message: "Invitation accepted successfully",
        data: result,
      });
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to accept invitation",
      });
    }
  }

  /**
   * POST /invitations/:id/decline
   * Decline an invitation
   */
  async declineInvitation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      // Get user email
      const { prisma } = await import("../../config/prisma");
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      const invitation = await invitationService.declineInvitation(id, user.email);

      res.status(200).json({
        success: true,
        message: "Invitation declined",
        data: invitation,
      });
    } catch (error: any) {
      console.error("Error declining invitation:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to decline invitation",
      });
    }
  }

  /**
   * GET /conferences/:conferenceId/invitations
   * Get all invitations for a conference (chair only)
   */
  async getConferenceInvitations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { conferenceId } = req.params;

      const invitations = await invitationService.getConferenceInvitations(
        conferenceId,
        userId
      );

      res.status(200).json({
        success: true,
        data: invitations,
      });
    } catch (error: any) {
      console.error("Error getting conference invitations:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to get conference invitations",
      });
    }
  }

  /**
   * DELETE /invitations/:id
   * Cancel an invitation (chair only)
   */
  async cancelInvitation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { id } = req.params;

      const invitation = await invitationService.cancelInvitation(id, userId);

      res.status(200).json({
        success: true,
        message: "Invitation cancelled",
        data: invitation,
      });
    } catch (error: any) {
      console.error("Error cancelling invitation:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to cancel invitation",
      });
    }
  }
}

export const invitationController = new InvitationController();
