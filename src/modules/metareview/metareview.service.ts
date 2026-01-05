import { prisma } from "../../config/prisma";

// ============================================================================
// TYPES
// ============================================================================

interface CreateMetareviewData {
  paperId: string;
  metaReviewerId: string;
  summary: string;
  strengths: string;
  weaknesses: string;
  recommendation: "ACCEPT" | "REJECT" | "BORDERLINE";
  confidence: number; // 1-5
  reviewConsensus: boolean;
  disagreementNote?: string;
}

interface UpdateMetareviewData {
  summary?: string;
  strengths?: string;
  weaknesses?: string;
  recommendation?: "ACCEPT" | "REJECT" | "BORDERLINE";
  confidence?: number;
  reviewConsensus?: boolean;
  disagreementNote?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const metareviewService = {
  /**
   * Create a metareview for a paper
   * Only META_REVIEWER or CHAIR can create metareviews
   */
  async createMetareview(data: CreateMetareviewData) {
    const { paperId, metaReviewerId, ...metareviewData } = data;

    // Validate paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        conference: true,
        reviewAssignments: {
          include: {
            review: true,
          },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Validate meta-reviewer exists and has META_REVIEWER role
    const metaReviewer = await prisma.user.findUnique({
      where: { id: metaReviewerId },
    });

    if (!metaReviewer) {
      throw new Error("Meta-reviewer not found");
    }

    // Check if meta-reviewer has META_REVIEWER or CHAIR role in this conference
    const membership = await prisma.conferenceMember.findFirst({
      where: {
        userId: metaReviewerId,
        conferenceId: paper.conferenceId,
        role: {
          in: ["META_REVIEWER", "CHAIR"],
        },
      },
    });

    if (!membership) {
      throw new Error(
        "User must have META_REVIEWER or CHAIR role in this conference"
      );
    }

    // Check if metareview already exists
    const existingMetareview = await prisma.metareview.findUnique({
      where: { paperId },
    });

    if (existingMetareview) {
      throw new Error("Metareview already exists for this paper");
    }

    // Validate confidence level (1-5)
    if (metareviewData.confidence < 1 || metareviewData.confidence > 5) {
      throw new Error("Confidence must be between 1 and 5");
    }

    // Create metareview
    const metareview = await prisma.metareview.create({
      data: {
        paperId,
        metaReviewerId,
        ...metareviewData,
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            conferenceId: true,
          },
        },
        metaReviewer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return metareview;
  },

  /**
   * Update a metareview (draft or submitted)
   */
  async updateMetareview(
    metareviewId: string,
    userId: string,
    data: UpdateMetareviewData
  ) {
    // Get existing metareview
    const metareview = await prisma.metareview.findUnique({
      where: { id: metareviewId },
      include: {
        paper: {
          select: {
            conferenceId: true,
          },
        },
      },
    });

    if (!metareview) {
      throw new Error("Metareview not found");
    }

    // Check if user is the meta-reviewer or chair
    const isMetaReviewer = metareview.metaReviewerId === userId;
    const isChair = await prisma.conferenceMember.findFirst({
      where: {
        userId,
        conferenceId: metareview.paper.conferenceId,
        role: "CHAIR",
      },
    });

    if (!isMetaReviewer && !isChair) {
      throw new Error("Only the meta-reviewer or chair can update this metareview");
    }

    // Validate confidence if provided
    if (data.confidence && (data.confidence < 1 || data.confidence > 5)) {
      throw new Error("Confidence must be between 1 and 5");
    }

    // Update metareview
    const updated = await prisma.metareview.update({
      where: { id: metareviewId },
      data,
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            conferenceId: true,
          },
        },
        metaReviewer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  },

  /**
   * Submit a metareview (mark as submitted)
   */
  async submitMetareview(metareviewId: string, userId: string) {
    const metareview = await prisma.metareview.findUnique({
      where: { id: metareviewId },
      include: {
        paper: {
          select: {
            conferenceId: true,
          },
        },
      },
    });

    if (!metareview) {
      throw new Error("Metareview not found");
    }

    // Check if user is the meta-reviewer
    if (metareview.metaReviewerId !== userId) {
      throw new Error("Only the meta-reviewer can submit this metareview");
    }

    // Check if already submitted
    if (metareview.submittedAt) {
      throw new Error("Metareview already submitted");
    }

    // Validate required fields
    if (
      !metareview.summary ||
      !metareview.strengths ||
      !metareview.weaknesses ||
      !metareview.recommendation ||
      !metareview.confidence
    ) {
      throw new Error("All required fields must be filled before submitting");
    }

    // Submit metareview
    const submitted = await prisma.metareview.update({
      where: { id: metareviewId },
      data: {
        submittedAt: new Date(),
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            conferenceId: true,
          },
        },
        metaReviewer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // TODO: Send notification to chair
    console.log(
      `[METAREVIEW SUBMITTED] Paper "${submitted.paper.title}" by ${submitted.metaReviewer.firstName} ${submitted.metaReviewer.lastName}`
    );

    return submitted;
  },

  /**
   * Get metareview for a paper
   */
  async getMetareviewByPaperId(paperId: string, userId: string) {
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

    const metareview = await prisma.metareview.findUnique({
      where: { paperId },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
            conferenceId: true,
          },
        },
        metaReviewer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return metareview;
  },

  /**
   * Get all metareviews for a conference
   * Only accessible by CHAIR or ADMIN
   */
  async getMetareviewsByConference(conferenceId: string, userId: string) {
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
      throw new Error("Only chair or admin can access all metareviews");
    }

    const metareviews = await prisma.metareview.findMany({
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
            abstract: true,
            status: true,
          },
        },
        metaReviewer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return metareviews;
  },

  /**
   * Get metareviews assigned to a specific meta-reviewer
   */
  async getMyMetareviews(userId: string, conferenceId?: string) {
    const where: any = {
      metaReviewerId: userId,
    };

    if (conferenceId) {
      where.paper = {
        conferenceId,
      };
    }

    const metareviews = await prisma.metareview.findMany({
      where,
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
            status: true,
            conferenceId: true,
            conference: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return metareviews;
  },

  /**
   * Delete a metareview (only if not submitted)
   */
  async deleteMetareview(metareviewId: string, userId: string) {
    const metareview = await prisma.metareview.findUnique({
      where: { id: metareviewId },
      include: {
        paper: {
          select: {
            conferenceId: true,
          },
        },
      },
    });

    if (!metareview) {
      throw new Error("Metareview not found");
    }

    // Check if user is the meta-reviewer or chair
    const isMetaReviewer = metareview.metaReviewerId === userId;
    const isChair = await prisma.conferenceMember.findFirst({
      where: {
        userId,
        conferenceId: metareview.paper.conferenceId,
        role: "CHAIR",
      },
    });

    if (!isMetaReviewer && !isChair) {
      throw new Error("Access denied");
    }

    // Prevent deletion if submitted
    if (metareview.submittedAt) {
      throw new Error("Cannot delete submitted metareview");
    }

    await prisma.metareview.delete({
      where: { id: metareviewId },
    });

    return { message: "Metareview deleted successfully" };
  },
};
