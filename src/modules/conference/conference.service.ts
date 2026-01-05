import { prisma } from "../../config/prisma";
import { MemberRole } from "../../generated/prisma/enums";

interface CreateConferenceData {
  name: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}

interface UpdateConferenceData {
  name?: string;
  description?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
}

export const conferenceService = {
  /**
   * Create a new conference (Admin only)
   */
  async createConference(data: CreateConferenceData) {
    if (!data.name) {
      throw new Error("Conference name is required");
    }

    if (!data.startDate || !data.endDate) {
      throw new Error("Start date and end date are required");
    }

    const conference = await prisma.conference.create({
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    return conference;
  },

   /**
   * Get all conferences (public list)
   * Returns all public conferences (including archived)
   * Frontend will filter archived conferences by default
   */
   async getAllConferences() {
    const conferences = await prisma.conference.findMany({
      where: {
        isPublic: true,
      },
      include: {
        members: {
          where: { role: MemberRole.CHAIR },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            papers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return conferences;
  },

  /**
   * Get conferences for a specific user
   * - If admin → all conferences
   * - Otherwise → conferences where user is a member (CHAIR, REVIEWER, or AUTHOR)
   */
  async getMyConferences(userId: string) {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // If admin, return all conferences
    if (user.isAdmin) {
      return this.getAllConferences();
    }

    // If not admin, get conferences where user is a member (any role)
    const conferences = await prisma.conference.findMany({
      where: {
        members: {
          some: {
            userId,
            // No role filter - get all conferences where user is a member
          },
        },
      },
      include: {
        members: {
          where: { role: MemberRole.CHAIR },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            papers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get user's role for each conference
    const userMemberships = await prisma.conferenceMember.findMany({
      where: {
        userId,
        conferenceId: { in: conferences.map(c => c.id) },
      },
      select: {
        conferenceId: true,
        role: true,
      },
    });

    // Map user role to each conference
    const roleMap = new Map(userMemberships.map(m => [m.conferenceId, m.role.toLowerCase()]));
    
    return conferences.map(conf => ({
      ...conf,
      userRole: roleMap.get(conf.id) || null,
    }));
  },

  /**
   * Get a single conference by ID (public)
   */
  async getConferenceById(id: string) {
    const conference = await prisma.conference.findUnique({
      where: { id },
      include: {
        members: {
          where: { role: MemberRole.CHAIR },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        settings: true,
        _count: {
          select: {
            papers: true,
          },
        },
      },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    return conference;
  },

  /**
   * Update a conference (Admin or Chair)
   */
  async updateConference(id: string, userId: string, data: UpdateConferenceData) {
    // Check if conference exists
    const existingConference = await prisma.conference.findUnique({
      where: { id },
    });

    if (!existingConference) {
      throw new Error("Conference not found");
    }

    const conference = await prisma.conference.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: {
        members: {
          where: { role: MemberRole.CHAIR },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return conference;
  },

  /**
   * Assign a chair to a conference (Admin only)
   * Only one chair per conference is allowed
   */
  async assignChair(conferenceId: string, userIdToAssign: string) {
    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Check if user to assign exists
    const userToAssign = await prisma.user.findUnique({
      where: { id: userIdToAssign },
    });

    if (!userToAssign) {
      throw new Error("User to assign not found");
    }

    // Check if conference already has a chair
    const existingChair = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId,
        role: MemberRole.CHAIR,
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (existingChair) {
      throw new Error(
        `Conference already has a chair: ${existingChair.user.firstName} ${existingChair.user.lastName} (${existingChair.user.email})`
      );
    }

    // Assign chair role
    const chairRole = await prisma.conferenceMember.create({
      data: {
        userId: userIdToAssign,
        conferenceId,
        role: MemberRole.CHAIR,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return chairRole;
  },

  /**
   * User joins a conference as "member"
   */
  async joinConference(userId: string, conferenceId: string) {
    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has AUTHOR role in this conference (multi-role support)
    const existingAuthorRole = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId,
        userId,
        role: MemberRole.AUTHOR,
      },
    });

    if (existingAuthorRole) {
      throw new Error("User already has AUTHOR role in this conference");
    }

    // Create member role
    const memberRole = await prisma.conferenceMember.create({
      data: {
        userId,
        conferenceId,
        role: MemberRole.AUTHOR,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return memberRole;
  },

  /**
   * Chair adds a user to conference as "member"
   */
  async addUserToConference(conferenceId: string, userIdToAdd: string) {
    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Check if user to add exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: userIdToAdd },
    });

    if (!userToAdd) {
      throw new Error("User to add not found");
    }

    // Check if user already has AUTHOR role (multi-role support)
    const existingAuthorRole = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId,
        userId: userIdToAdd,
        role: MemberRole.AUTHOR,
      },
    });

    if (existingAuthorRole) {
      throw new Error("User already has AUTHOR role in this conference");
    }

    // Create member role
    const memberRole = await prisma.conferenceMember.create({
      data: {
        userId: userIdToAdd,
        conferenceId,
        role: MemberRole.AUTHOR,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return memberRole;
  },

  /**
   * Chair promotes a member to "reviewer" role
   * Note: This adds a new role record, doesn't replace existing ones
   */
  async assignReviewerRole(conferenceId: string, userIdToAssign: string) {
    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdToAssign },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has REVIEWER role (multi-role support)
    const existingReviewerRole = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId,
        userId: userIdToAssign,
        role: MemberRole.REVIEWER,
      },
    });

    if (existingReviewerRole) {
      throw new Error("User already has REVIEWER role in this conference");
    }

    // Create reviewer role (additive - doesn't remove other roles)
    const reviewerRole = await prisma.conferenceMember.create({
      data: {
        userId: userIdToAssign,
        conferenceId,
        role: MemberRole.REVIEWER,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return reviewerRole;
  },

  /**
   * Get all members of a conference
   */
  async getConferenceMembers(conferenceId: string) {
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
      orderBy: { createdAt: "desc" },
    });

    return members;
  },

  /**
   * Get all tracks for a conference
   */
  async getConferenceTracks(conferenceId: string) {
    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    const tracks = await prisma.track.findMany({
      where: { conferenceId },
      include: {
        _count: {
          select: {
            papers: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return tracks;
  },

  /**
   * Create a new track for a conference
   */
  async createTrack(
    conferenceId: string,
    data: { name: string; description?: string }
  ) {
    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Check if track name already exists for this conference
    const existingTrack = await prisma.track.findFirst({
      where: {
        conferenceId,
        name: data.name,
      },
    });

    if (existingTrack) {
      throw new Error("Track with this name already exists");
    }

    const track = await prisma.track.create({
      data: {
        conferenceId,
        name: data.name,
        description: data.description,
      },
      include: {
        _count: {
          select: {
            papers: true,
          },
        },
      },
    });

    return track;
  },

  /**
   * Delete a track from a conference (Admin or Chair)
   */
  async deleteTrack(conferenceId: string, trackId: string) {
    // Check if track exists and belongs to this conference
    const track = await prisma.track.findFirst({
      where: {
        id: trackId,
        conferenceId,
      },
      include: {
        _count: {
          select: {
            papers: true,
          },
        },
      },
    });

    if (!track) {
      throw new Error("Track not found");
    }

    // Prevent deletion if track has papers
    if (track._count.papers > 0) {
      throw new Error(`Cannot delete track with ${track._count.papers} assigned paper(s)`);
    }

    await prisma.track.delete({
      where: { id: trackId },
    });

    return { message: "Track deleted successfully" };
  },

  /**
   * Archive a conference (Admin or Chair)
   * Changes status from "active" to "archived"
   */
  async archiveConference(conferenceId: string) {
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    if (conference.status === "archived") {
      throw new Error("Conference is already archived");
    }

    const updated = await prisma.conference.update({
      where: { id: conferenceId },
      data: { status: "archived" },
      include: {
        members: {
          where: { role: MemberRole.CHAIR },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return updated;
  },

  /**
   * Unarchive a conference (Admin or Chair)
   * Changes status from "archived" to "active"
   */
  async unarchiveConference(conferenceId: string) {
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    if (conference.status !== "archived") {
      throw new Error("Conference is not archived");
    }

    const updated = await prisma.conference.update({
      where: { id: conferenceId },
      data: { status: "active" },
      include: {
        members: {
          where: { role: MemberRole.CHAIR },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return updated;
  },

  /**
   * Update conference settings (Admin or Chair)
   * Creates settings record if it doesn't exist (upsert)
   */
  async updateConferenceSettings(
    conferenceId: string,
    data: {
      submissionDeadline?: Date;
      reviewDeadline?: Date;
      maxReviewersPerPaper?: number;
      assignmentTimeoutDays?: number;
    }
  ) {
    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Upsert settings
    const settings = await prisma.conferenceSettings.upsert({
      where: { conferenceId },
      create: {
        conferenceId,
        submissionDeadline: data.submissionDeadline,
        reviewDeadline: data.reviewDeadline,
        maxReviewersPerPaper: data.maxReviewersPerPaper ?? 3,
        assignmentTimeoutDays: data.assignmentTimeoutDays ?? 3,
      },
      update: {
        submissionDeadline: data.submissionDeadline,
        reviewDeadline: data.reviewDeadline,
        maxReviewersPerPaper: data.maxReviewersPerPaper,
        assignmentTimeoutDays: data.assignmentTimeoutDays,
      },
    });

    return settings;
  },
};
