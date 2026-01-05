import { prisma } from "../../config/prisma";

export const authService = {
  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            memberships: true,
            papers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users;
  },

  /**
   * Update admin status for a user
   */
  async updateAdminStatus(userId: string, isAdmin: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
      },
    });

    return updatedUser;
  },

  /**
   * Get current user with permissions based on ConferenceMember roles
   */
  async getCurrentUser(userId: string) {
    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get user's conference memberships
    const memberships = await prisma.conferenceMember.findMany({
      where: { userId },
      select: {
        role: true,
        conferenceId: true,
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Determine permissions based on memberships
    const normalizeRole = (role: string) => role?.toUpperCase() || "";

    const memberRoles = memberships.map((m) => normalizeRole(m.role));

    const isChair = user.isAdmin || memberRoles.includes("CHAIR");
    const isReviewer = memberRoles.includes("REVIEWER") || isChair;
    const isAuthor =
      memberRoles.includes("AUTHOR") || memberships.length > 0 || isChair;

    // Build conference roles map
    const conferenceRoles: Record<string, string[]> = {};
    memberships.forEach((m) => {
      if (!conferenceRoles[m.conferenceId]) {
        conferenceRoles[m.conferenceId] = [];
      }
      conferenceRoles[m.conferenceId].push(normalizeRole(m.role));
    });

    // Get stats for dynamic sidebar visibility
    const [
      requestsCount,
      papersCount,
      invitationsCount,
      reviewAssignmentsCount,
      pendingReviewsCount,
      newDecisionsCount,
    ] = await Promise.all([
      // Count conference requests created by user
      prisma.conferenceRequest.count({
        where: { requesterId: userId },
      }),
      // Count papers where user is an author
      prisma.paperAuthor.count({
        where: { userId },
      }),
      // Count pending invitations for user's email
      prisma.invitation.count({
        where: {
          inviteeEmail: user.email,
          status: "PENDING",
        },
      }),
      // Count review assignments
      prisma.reviewAssignment.count({
        where: { reviewerId: userId },
      }),
      // Count pending reviews (not submitted yet)
      prisma.reviewAssignment.count({
        where: {
          reviewerId: userId,
          status: { not: "SUBMITTED" },
        },
      }),
      // Count papers with new decisions (user is author, paper has decision, status changed recently)
      prisma.paper.count({
        where: {
          authors: {
            some: { userId },
          },
          status: { in: ["accepted", "rejected"] },
          decision: {
            isNot: null,
          },
        },
      }),
    ]);

    // Calculate total notifications
    const totalNotifications = invitationsCount + pendingReviewsCount;

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      permissions: {
        isAdmin: user.isAdmin,
        isChair,
        isReviewer,
        isAuthor,
      },
      memberships: memberships.map((m) => ({
        conferenceId: m.conferenceId,
        conferenceName: m.conference.name,
        role: normalizeRole(m.role),
      })),
      conferenceRoles,
      stats: {
        hasRequests: requestsCount > 0,
        hasPapers: papersCount > 0,
        hasInvitations: invitationsCount > 0,
        hasReviewAssignments: reviewAssignmentsCount > 0,
        hasConferences: memberships.length > 0,
        // Notification counts
        pendingInvitations: invitationsCount,
        pendingReviews: pendingReviewsCount,
        newDecisions: newDecisionsCount,
        totalNotifications,
      },
    };
  },
};
