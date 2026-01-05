import { prisma } from "../../config/prisma";
import { MemberRole } from "../../generated/prisma/enums";

interface AddMemberData {
  email: string;
  role: MemberRole;
}

interface UpdateMemberData {
  role: MemberRole;
}

export const conferenceMembersService = {
  /**
   * Get all members of a conference
   */
  async getMembers(conferenceId: string) {
    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    const members = await prisma.conferenceMember.findMany({
      where: { conferenceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isAdmin: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // CHAIR comes first (alphabetically)
        { createdAt: "desc" },
      ],
    });

    // Sort by role priority: CHAIR > META_REVIEWER > REVIEWER > AUTHOR
    const rolePriority: Record<MemberRole, number> = {
      CHAIR: 0,
      META_REVIEWER: 1,
      REVIEWER: 2,
      AUTHOR: 3,
    };

    return members.sort((a, b) => rolePriority[a.role] - rolePriority[b.role]);
  },

  /**
   * Add a member to a conference
   * Multi-role support: Can add the same user with different roles
   */
  async addMember(conferenceId: string, data: AddMemberData) {
    const { email, role } = data;

    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error("User not found with this email");
    }

    // Check if member already has this specific role
    const existingMemberWithRole = await prisma.conferenceMember.findUnique({
      where: {
        conferenceId_userId_role: {
          conferenceId,
          userId: user.id,
          role,
        },
      },
    });

    if (existingMemberWithRole) {
      throw new Error("User already has this role in this conference");
    }

    // Create member
    const member = await prisma.conferenceMember.create({
      data: {
        conferenceId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isAdmin: true,
          },
        },
      },
    });

    return member;
  },

  /**
   * Update a member's role
   */
  async updateMember(
    conferenceId: string,
    memberId: string,
    data: UpdateMemberData
  ) {
    const { role } = data;

    // Find the member
    const member = await prisma.conferenceMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error("Member not found");
    }

    if (member.conferenceId !== conferenceId) {
      throw new Error("Member does not belong to this conference");
    }

    // If downgrading from CHAIR, check if this is the last chair
    if (member.role === "CHAIR" && role !== "CHAIR") {
      const chairCount = await prisma.conferenceMember.count({
        where: {
          conferenceId,
          role: "CHAIR",
        },
      });

      if (chairCount <= 1) {
        throw new Error("Cannot downgrade the last chair of the conference");
      }
    }

    // Update member
    const updatedMember = await prisma.conferenceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isAdmin: true,
          },
        },
      },
    });

    return updatedMember;
  },

  /**
   * Remove a member from a conference
   */
  async removeMember(conferenceId: string, memberId: string) {
    // Find the member
    const member = await prisma.conferenceMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error("Member not found");
    }

    if (member.conferenceId !== conferenceId) {
      throw new Error("Member does not belong to this conference");
    }

    // If removing a CHAIR, check if this is the last chair
    if (member.role === "CHAIR") {
      const chairCount = await prisma.conferenceMember.count({
        where: {
          conferenceId,
          role: "CHAIR",
        },
      });

      if (chairCount <= 1) {
        throw new Error("Cannot remove the last chair of the conference");
      }
    }

    // Delete member
    await prisma.conferenceMember.delete({
      where: { id: memberId },
    });

    return { success: true };
  },

  /**
   * Check if a user is a chair of a conference
   * Multi-role support: Checks if any of user's roles is CHAIR
   */
  async isChair(conferenceId: string, userId: string): Promise<boolean> {
    const chairMembership = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId,
        userId,
        role: "CHAIR",
      },
    });

    return !!chairMembership;
  },

  /**
   * Get a user's roles in a conference
   * Multi-role support: Returns array of all roles user has
   */
  async getMemberRoles(
    conferenceId: string,
    userId: string
  ): Promise<MemberRole[]> {
    const members = await prisma.conferenceMember.findMany({
      where: {
        conferenceId,
        userId,
      },
      select: { role: true },
    });

    return members.map((m) => m.role);
  },

  /**
   * Get a user's primary role in a conference (highest priority)
   * Kept for backward compatibility
   */
  async getMemberRole(
    conferenceId: string,
    userId: string
  ): Promise<MemberRole | null> {
    const roles = await this.getMemberRoles(conferenceId, userId);

    if (roles.length === 0) return null;

    // Return highest priority role: CHAIR > REVIEWER > AUTHOR
    if (roles.includes(MemberRole.CHAIR)) return MemberRole.CHAIR;
    if (roles.includes(MemberRole.REVIEWER)) return MemberRole.REVIEWER;
    if (roles.includes(MemberRole.AUTHOR)) return MemberRole.AUTHOR;

    return null;
  },
};

