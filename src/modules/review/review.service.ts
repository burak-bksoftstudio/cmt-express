import { prisma } from "../../config/prisma";
import { getUserConferenceRole } from "../auth/auth.middleware";

type ReviewPayload = {
  score?: number;
  confidence?: number;
  summary?: string;
  strengths?: string;
  weaknesses?: string;
  commentsToAuthor?: string;
  commentsToChair?: string;
};

async function getAssignmentWithAccess(assignmentId: string, userId: string) {
  const assignment = (await prisma.reviewAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      review: true,
      paper: {
        select: {
          id: true,
          title: true,
          abstract: true,
          conferenceId: true,
          conference: {
            select: {
              id: true,
              name: true,
            },
          },
          track: {
            select: {
              name: true,
            },
          },
          authors: {
            select: {
              userId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          // Include paper files for reviewer to download
          files: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              fileKey: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      reviewer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  } as any)) as any;

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isAdmin: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // SECURITY: Check if user is an author of the paper being reviewed
  const isAuthorOfPaper = assignment.paper.authors.some(
    (a: { userId: string }) => a.userId === userId
  );

  if (isAuthorOfPaper && !user.isAdmin) {
    throw new Error("Authors cannot access reviews of their own papers");
  }

  if (user.isAdmin) {
    return { assignment, user, role: { isChair: true, isReviewer: false, isAuthor: false } };
  }

  const role = await getUserConferenceRole(userId, assignment.paper.conferenceId);

  // Chairs can access everything; reviewers only their assignment
  if (role.isChair) {
    return { assignment, user, role };
  }

  if (role.isReviewer && assignment.reviewerId === userId) {
    return { assignment, user, role };
  }

  throw new Error("Forbidden");
}

function validateScoreConfidence(score?: number, confidence?: number) {
  if (score !== undefined && (score < 1 || score > 10)) {
    throw new Error("Score must be between 1 and 10");
  }
  if (confidence !== undefined && (confidence < 1 || confidence > 5)) {
    throw new Error("Confidence must be between 1 and 5");
  }
}

export const reviewService = {
  /**
   * Get review by assignment ID (for ReviewDetailPage)
   * Returns assignment data with review in the format expected by frontend
   */
  async getReviewById(assignmentId: string, userId: string) {
    const { assignment } = await getAssignmentWithAccess(assignmentId, userId);

    // Transform to the format expected by ReviewDetailPage
    const review = assignment.review;
    const status = assignment.status === "SUBMITTED"
      ? "submitted"
      : review
        ? "draft"
        : "not_started";

    return {
      id: review?.id || assignment.id,
      assignmentId: assignment.id,
      status,
      overallScore: review?.score || null,
      confidence: review?.confidence || null,
      summary: review?.summary || null,
      strengths: review?.strengths || null,
      weaknesses: review?.weaknesses || null,
      commentsToAuthor: review?.commentsToAuthor || null,
      commentsToChair: review?.commentsToChair || null,
      paper: {
        id: assignment.paper.id,
        title: assignment.paper.title,
        abstract: assignment.paper.abstract,
        conference: assignment.paper.conference,
        track: assignment.paper.track,
        authors: assignment.paper.authors,
        files: assignment.paper.files || [],
      },
      deadline: assignment.dueDate?.toISOString() || null,
      submittedAt: review?.submittedAt?.toISOString() || null,
    };
  },

  async getAssignment(assignmentId: string, userId: string) {
    const { assignment } = await getAssignmentWithAccess(assignmentId, userId);
    return assignment;
  },

  async saveDraft(assignmentId: string, userId: string, data: ReviewPayload) {
    const { assignment } = await getAssignmentWithAccess(assignmentId, userId);

    validateScoreConfidence(data.score, data.confidence);

    // Ensure review exists
    if (!assignment.review) {
      await prisma.review.create({
        data: { assignmentId: assignment.id } as any,
      });
    }

    const updated = await prisma.review.update({
      where: { assignmentId },
      data: {
        score: data.score ?? assignment.review?.score ?? null,
        confidence: data.confidence ?? assignment.review?.confidence ?? null,
        summary: data.summary ?? assignment.review?.summary ?? null,
        strengths: data.strengths ?? assignment.review?.strengths ?? null,
        weaknesses: data.weaknesses ?? assignment.review?.weaknesses ?? null,
        commentsToAuthor:
          data.commentsToAuthor ?? assignment.review?.commentsToAuthor ?? null,
        commentsToChair:
          data.commentsToChair ?? assignment.review?.commentsToChair ?? null,
      } as any,
      include: {
        assignment: {
          include: {
            reviewer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            paper: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    } as any);

    await prisma.reviewAssignment.update({
      where: { id: assignmentId },
      data: { status: "DRAFT" },
    });

    return { review: updated };
  },

  async submitReview(
    assignmentId: string,
    userId: string,
    data: ReviewPayload
  ) {
    const { assignment } = await getAssignmentWithAccess(assignmentId, userId);

    validateScoreConfidence(data.score, data.confidence);

    // Ensure review exists
    if (!assignment.review) {
      await prisma.review.create({
        data: { assignmentId: assignment.id } as any,
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    const now = new Date();
    const deadlinePassed =
      assignment.dueDate !== null && assignment.dueDate !== undefined
        ? now.getTime() > assignment.dueDate.getTime()
        : false;

    // Enforce deadline for non-admins
    if (deadlinePassed && !user?.isAdmin) {
      throw new Error("Review deadline has passed");
    }

    const updated = await prisma.review.update({
      where: { assignmentId },
      data: {
        score: data.score ?? assignment.review?.score ?? null,
        confidence: data.confidence ?? assignment.review?.confidence ?? null,
        summary: data.summary ?? assignment.review?.summary ?? null,
        strengths: data.strengths ?? assignment.review?.strengths ?? null,
        weaknesses: data.weaknesses ?? assignment.review?.weaknesses ?? null,
        commentsToAuthor:
          data.commentsToAuthor ?? assignment.review?.commentsToAuthor ?? null,
        commentsToChair:
          data.commentsToChair ?? assignment.review?.commentsToChair ?? null,
        submittedAt: now,
      } as any,
      include: {
        assignment: {
          include: {
            reviewer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            paper: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    } as any);

    await prisma.reviewAssignment.update({
      where: { id: assignmentId },
      data: { status: "SUBMITTED" },
    });

    return {
      review: updated,
    };
  },

  /**
   * Get all reviews for a paper
   * @param paperId - The paper ID
   * @param userId - The requesting user ID (optional)
   * @param isChairOrAdmin - Whether the user is a chair or admin
   * @returns Reviews with reviewer info anonymized for non-chair/admin users
   */
  async getReviewsByPaperId(paperId: string, userId?: string, isChairOrAdmin: boolean = false) {
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        authors: {
          select: { userId: true },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // SECURITY: Authors cannot see reviews of their own papers (before decision)
    if (userId) {
      const isAuthor = paper.authors.some((a) => a.userId === userId);
      if (isAuthor && !isChairOrAdmin) {
        // Check if there's a decision - if so, allow limited view
        const decision = await prisma.decision.findUnique({
          where: { paperId },
        });

        if (!decision) {
          throw new Error("Authors cannot view reviews before decision is made");
        }
      }
    }

    const assignments = (await prisma.reviewAssignment.findMany({
      where: { paperId },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        review: true,
      },
      orderBy: { createdAt: "asc" },
    } as any)) as any;

    // ANONYMIZATION: Hide reviewer details for non-chair/admin users
    if (!isChairOrAdmin) {
      return assignments.map((assignment: any, index: number) => ({
        ...assignment,
        reviewer: {
          id: `anonymous-${index + 1}`,
          email: null,
          firstName: `Reviewer`,
          lastName: `${index + 1}`,
        },
        reviewerId: `anonymous-${index + 1}`,
        // Also hide commentsToChair from non-chair users
        review: assignment.review ? {
          ...assignment.review,
          commentsToChair: null,
        } : null,
      }));
    }

    return assignments;
  },
};


