import { prisma } from "../../config/prisma";

// ============================================================================
// TYPES
// ============================================================================

interface CreateDiscussionData {
  paperId: string;
}

interface CreateMessageData {
  discussionId: string;
  userId: string;
  message: string;
  isInternal?: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

export const discussionService = {
  /**
   * Create a discussion for a paper
   * Automatically created when first message is posted
   */
  async createDiscussion(data: CreateDiscussionData) {
    const { paperId } = data;

    // Validate paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        conferenceId: true,
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Check if discussion already exists
    const existingDiscussion = await prisma.discussion.findUnique({
      where: { paperId },
    });

    if (existingDiscussion) {
      throw new Error("Discussion already exists for this paper");
    }

    // Create discussion
    const discussion = await prisma.discussion.create({
      data: {
        paperId,
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            conferenceId: true,
          },
        },
      },
    });

    return discussion;
  },

  /**
   * Get or create discussion for a paper
   */
  async getOrCreateDiscussion(paperId: string) {
    let discussion = await prisma.discussion.findUnique({
      where: { paperId },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            conferenceId: true,
          },
        },
        messages: {
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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!discussion) {
      const created = await this.createDiscussion({ paperId });
      discussion = await prisma.discussion.findUnique({
        where: { paperId },
        include: {
          paper: {
            select: {
              id: true,
              title: true,
              conferenceId: true,
            },
          },
          messages: {
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
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    }

    return discussion;
  },

  /**
   * Add a message to a discussion
   * Only META_REVIEWER and CHAIR can post messages
   */
  async addMessage(data: CreateMessageData) {
    const { discussionId, userId, message, isInternal = true } = data;

    // Get discussion
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: {
        paper: {
          select: {
            conferenceId: true,
          },
        },
      },
    });

    if (!discussion) {
      throw new Error("Discussion not found");
    }

    // Check if discussion is closed
    if (discussion.status === "closed") {
      throw new Error("Cannot add messages to a closed discussion");
    }

    // Validate user has META_REVIEWER or CHAIR role
    const membership = await prisma.conferenceMember.findFirst({
      where: {
        userId,
        conferenceId: discussion.paper.conferenceId,
        role: {
          in: ["META_REVIEWER", "CHAIR"],
        },
      },
    });

    if (!membership) {
      throw new Error(
        "Only META_REVIEWER or CHAIR can post messages to discussion"
      );
    }

    // Create message
    const newMessage = await prisma.discussionMessage.create({
      data: {
        discussionId,
        userId,
        message,
        isInternal,
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
      },
    });

    return newMessage;
  },

  /**
   * Get discussion with messages for a paper
   */
  async getDiscussionByPaperId(paperId: string, userId: string) {
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        conferenceId: true,
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Check if user has access (META_REVIEWER, CHAIR, or ADMIN)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    const membership = await prisma.conferenceMember.findFirst({
      where: {
        userId,
        conferenceId: paper.conferenceId,
        role: {
          in: ["META_REVIEWER", "CHAIR"],
        },
      },
    });

    if (!user?.isAdmin && !membership) {
      throw new Error("Access denied");
    }

    const discussion = await this.getOrCreateDiscussion(paperId);

    return discussion;
  },

  /**
   * Close a discussion
   * Only CHAIR can close discussions
   */
  async closeDiscussion(discussionId: string, userId: string) {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: {
        paper: {
          select: {
            conferenceId: true,
          },
        },
      },
    });

    if (!discussion) {
      throw new Error("Discussion not found");
    }

    // Check if user is chair
    const isChair = await prisma.conferenceMember.findFirst({
      where: {
        userId,
        conferenceId: discussion.paper.conferenceId,
        role: "CHAIR",
      },
    });

    if (!isChair) {
      throw new Error("Only chair can close discussions");
    }

    // Check if already closed
    if (discussion.status === "closed") {
      throw new Error("Discussion is already closed");
    }

    // Close discussion
    const closed = await prisma.discussion.update({
      where: { id: discussionId },
      data: {
        status: "closed",
        closedAt: new Date(),
        closedById: userId,
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return closed;
  },

  /**
   * Reopen a discussion
   * Only CHAIR can reopen discussions
   */
  async reopenDiscussion(discussionId: string, userId: string) {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      include: {
        paper: {
          select: {
            conferenceId: true,
          },
        },
      },
    });

    if (!discussion) {
      throw new Error("Discussion not found");
    }

    // Check if user is chair
    const isChair = await prisma.conferenceMember.findFirst({
      where: {
        userId,
        conferenceId: discussion.paper.conferenceId,
        role: "CHAIR",
      },
    });

    if (!isChair) {
      throw new Error("Only chair can reopen discussions");
    }

    // Check if already open
    if (discussion.status === "open") {
      throw new Error("Discussion is already open");
    }

    // Reopen discussion
    const reopened = await prisma.discussion.update({
      where: { id: discussionId },
      data: {
        status: "open",
        closedAt: null,
        closedById: null,
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return reopened;
  },

  /**
   * Get all discussions for a conference
   * Only CHAIR or ADMIN can access
   */
  async getDiscussionsByConference(conferenceId: string, userId: string) {
    // Check if user is chair or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    const isChair = await prisma.conferenceMember.findFirst({
      where: {
        userId,
        conferenceId,
        role: "CHAIR",
      },
    });

    if (!user?.isAdmin && !isChair) {
      throw new Error("Only chair or admin can access all discussions");
    }

    const discussions = await prisma.discussion.findMany({
      where: {
        paper: {
          conferenceId,
        },
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        messages: {
          select: {
            id: true,
            message: true,
            isInternal: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Only get latest message for preview
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return discussions;
  },

  /**
   * Delete a message
   * Only the message author or CHAIR can delete
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.discussionMessage.findUnique({
      where: { id: messageId },
      include: {
        discussion: {
          include: {
            paper: {
              select: {
                conferenceId: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user is the message author or chair
    const isAuthor = message.userId === userId;
    const isChair = await prisma.conferenceMember.findFirst({
      where: {
        userId,
        conferenceId: message.discussion.paper.conferenceId,
        role: "CHAIR",
      },
    });

    if (!isAuthor && !isChair) {
      throw new Error("Only the message author or chair can delete messages");
    }

    await prisma.discussionMessage.delete({
      where: { id: messageId },
    });

    return { message: "Message deleted successfully" };
  },
};
