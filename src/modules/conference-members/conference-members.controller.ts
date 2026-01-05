import { Request, Response } from "express";
import { conferenceMembersService } from "./conference-members.service";
import { MemberRole } from "../../generated/prisma/enums";

export const conferenceMembersController = {
  /**
   * GET /conferences/:id/members
   * Get all members of a conference
   */
  async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const members = await conferenceMembersService.getMembers(id);

      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get members";
      const status = message === "Conference not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * POST /conferences/:id/members
   * Add a member to a conference
   */
  async addMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, role } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "Email is required",
        });
        return;
      }

      // Validate role
      const validRoles: MemberRole[] = ["CHAIR", "REVIEWER", "AUTHOR"];
      const memberRole: MemberRole = validRoles.includes(role) ? role : "AUTHOR";

      const member = await conferenceMembersService.addMember(id, {
        email,
        role: memberRole,
      });

      res.status(201).json({
        success: true,
        message: "Member added successfully",
        data: member,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add member";
      let status = 400;
      if (message === "Conference not found") {
        status = 404;
      } else if (message === "User not found with this email") {
        status = 404;
      } else if (message === "User is already a member of this conference") {
        status = 409;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * PATCH /conferences/:id/members/:memberId
   * Update a member's role
   */
  async updateMember(req: Request, res: Response): Promise<void> {
    try {
      const { id, memberId } = req.params;
      const { role } = req.body;

      if (!role) {
        res.status(400).json({
          success: false,
          message: "Role is required",
        });
        return;
      }

      // Validate role
      const validRoles: MemberRole[] = ["CHAIR", "REVIEWER", "AUTHOR"];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: "Invalid role. Must be CHAIR, REVIEWER, or AUTHOR",
        });
        return;
      }

      const member = await conferenceMembersService.updateMember(
        id,
        memberId,
        { role }
      );

      res.status(200).json({
        success: true,
        message: "Member role updated successfully",
        data: member,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update member";
      let status = 400;
      if (message === "Member not found") {
        status = 404;
      } else if (message === "Cannot downgrade the last chair of the conference") {
        status = 403;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * DELETE /conferences/:id/members/:memberId
   * Remove a member from a conference
   */
  async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const { id, memberId } = req.params;

      await conferenceMembersService.removeMember(id, memberId);

      res.status(200).json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove member";
      let status = 400;
      if (message === "Member not found") {
        status = 404;
      } else if (message === "Cannot remove the last chair of the conference") {
        status = 403;
      }
      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};

