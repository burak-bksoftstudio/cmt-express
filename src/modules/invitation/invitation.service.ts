import { prisma } from "../../config/prisma";
import { InvitationStatus, MemberRole } from "../../generated/prisma/enums";
import { emailService } from "../email/email.service";

export class InvitationService {
  /**
   * Send an invitation to join a conference with a specific role
   */
  async sendInvitation(
    conferenceId: string,
    inviterId: string,
    inviteeEmail: string,
    role: MemberRole,
    message?: string
  ) {
    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Check if inviter is a chair
    const inviterMembership = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId,
        userId: inviterId,
        role: "CHAIR",
      },
    });

    if (!inviterMembership) {
      throw new Error("Only conference chairs can send invitations");
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        conferenceId,
        inviteeEmail,
        role,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      throw new Error("A pending invitation already exists for this user and role");
    }

    // Check if user is already a member with this role
    const existingUser = await prisma.user.findUnique({
      where: { email: inviteeEmail },
      include: {
        memberships: {
          where: {
            conferenceId,
            role,
          },
        },
      },
    });

    if (existingUser && existingUser.memberships.length > 0) {
      throw new Error("User is already a member with this role in the conference");
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        conferenceId,
        inviterId,
        inviteeEmail,
        role,
        message,
        status: "PENDING",
      },
      include: {
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send invitation email
    try {
      await emailService.sendInvitationEmail({
        inviteeEmail,
        inviterName: `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
        conferenceName: invitation.conference.name,
        role,
        message,
        invitationId: invitation.id,
        existingUser: !!existingUser, // User already has account
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the invitation creation if email fails
    }

    return invitation;
  }

  /**
   * Accept an invitation and create conference membership
   */
  async acceptInvitation(invitationId: string, userEmail: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        conference: true,
        inviter: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.inviteeEmail !== userEmail) {
      throw new Error("This invitation is not for you");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("This invitation has already been processed");
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw new Error("User not found. Please register first.");
    }

    // Use transaction to update invitation and create membership
    const result = await prisma.$transaction(async (tx) => {
      // Update invitation status
      const updatedInvitation = await tx.invitation.update({
        where: { id: invitationId },
        data: {
          status: "ACCEPTED",
          respondedAt: new Date(),
        },
      });

      // Check if membership already exists
      const existingMembership = await tx.conferenceMember.findUnique({
        where: {
          conferenceId_userId_role: {
            conferenceId: invitation.conferenceId,
            userId: user!.id,
            role: invitation.role,
          },
        },
      });

      let membership;
      if (!existingMembership) {
        // Create conference membership
        membership = await tx.conferenceMember.create({
          data: {
            conferenceId: invitation.conferenceId,
            userId: user!.id,
            role: invitation.role,
          },
        });
      } else {
        membership = existingMembership;
      }

      return { invitation: updatedInvitation, membership };
    });

    // Send notification to inviter
    try {
      await emailService.sendInvitationAcceptedEmail({
        inviterEmail: invitation.inviter.email,
        inviteeName: `${user.firstName} ${user.lastName}`,
        conferenceName: invitation.conference.name,
        role: invitation.role,
      });
    } catch (emailError) {
      console.error("Failed to send acceptance notification:", emailError);
      // Don't fail the acceptance if email fails
    }

    return result;
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(invitationId: string, userEmail: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        conference: {
          select: {
            name: true,
          },
        },
        inviter: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.inviteeEmail !== userEmail) {
      throw new Error("This invitation is not for you");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("This invitation has already been processed");
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: "DECLINED",
        respondedAt: new Date(),
      },
    });

    // Get user info for notification
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    // Send notification to inviter
    try {
      await emailService.sendInvitationDeclinedEmail({
        inviterEmail: invitation.inviter.email,
        inviteeName: user ? `${user.firstName} ${user.lastName}` : userEmail,
        conferenceName: invitation.conference.name,
        role: invitation.role,
      });
    } catch (emailError) {
      console.error("Failed to send decline notification:", emailError);
      // Don't fail the decline if email fails
    }

    return updatedInvitation;
  }

  /**
   * Get all invitations for a specific email (for the invitee)
   */
  async getInvitationsByEmail(email: string, statusFilter?: InvitationStatus) {
    const where: any = { inviteeEmail: email };

    if (statusFilter) {
      where.status = statusFilter;
    }

    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        conference: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invitations;
  }

  /**
   * Get all invitations for a conference (for chairs)
   */
  async getConferenceInvitations(conferenceId: string, userId: string) {
    // Verify user is a chair
    const chairMembership = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId,
        userId,
        role: "CHAIR",
      },
    });

    if (!chairMembership) {
      throw new Error("Only conference chairs can view invitations");
    }

    const invitations = await prisma.invitation.findMany({
      where: { conferenceId },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return invitations;
  }

  /**
   * Cancel an invitation (for chairs)
   */
  async cancelInvitation(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Verify user is a chair
    const chairMembership = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId: invitation.conferenceId,
        userId,
        role: "CHAIR",
      },
    });

    if (!chairMembership) {
      throw new Error("Only conference chairs can cancel invitations");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("Only pending invitations can be cancelled");
    }

    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: "EXPIRED",
        respondedAt: new Date(),
      },
    });

    return updatedInvitation;
  }
}

export const invitationService = new InvitationService();
