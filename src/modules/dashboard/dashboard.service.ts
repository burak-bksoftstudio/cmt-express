import { prisma } from "../../config/prisma";

interface PaperStats {
  total: number;
  submitted: number;
  accepted: number;
  rejected: number;
  cameraReady: number;
}

interface ReviewStats {
  totalReviews: number;
  averageScore: number | null;
  averageConfidence: number | null;
}

interface ReviewerLoad {
  reviewerId: string;
  firstName: string;
  lastName: string;
  email: string;
  totalAssigned: number;
  completedReviews: number;
}

interface TimelineEvent {
  type: "assignment" | "review_submitted" | "decision";
  timestamp: Date;
  description: string;
  paperId?: string;
  paperTitle?: string;
}

interface ConferenceStats {
  papers: PaperStats;
  reviews: ReviewStats;
  reviewers: ReviewerLoad[];
  timeline: TimelineEvent[];
}

export const dashboardService = {
  /**
   * Get user's dashboard data grouped by roles
   */
  async getMyDashboard(userId: string) {
    // Get user's conference memberships grouped by role
    const memberships = await prisma.conferenceMember.findMany({
      where: { userId },
      include: {
        conference: {
          select: {
            id: true,
            name: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            status: true,
            _count: {
              select: {
                papers: true,
              },
            },
          },
        },
      },
      orderBy: {
        conference: {
          startDate: "desc",
        },
      },
    });

    // Group conferences by role
    const chairConferences = memberships
      .filter((m) => m.role === "CHAIR")
      .map((m) => m.conference);

    const reviewerConferences = memberships
      .filter((m) => m.role === "REVIEWER")
      .map((m) => m.conference);

    const authorConferences = memberships
      .filter((m) => m.role === "AUTHOR")
      .map((m) => m.conference);

    // Get user's papers with latest status
    // SECURITY: Don't leak review assignment counts to authors before decision
    const myPapersRaw = await prisma.paper.findMany({
      where: {
        authors: {
          some: { userId },
        },
      },
      include: {
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
        authors: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        decision: {
          select: {
            finalDecision: true,
            decidedAt: true,
          },
        },
        _count: {
          select: {
            reviewAssignments: true,
            cameraReadyFiles: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    // SECURITY: Filter out sensitive information for papers without decision
    // Authors should not know how many reviewers are assigned until decision is made
    const myPapers = myPapersRaw.map((paper: any) => {
      const hasDecision = !!paper.decision?.finalDecision;
      return {
        ...paper,
        _count: {
          ...paper._count,
          // Hide review assignment count until decision is made
          reviewAssignments: hasDecision ? paper._count.reviewAssignments : 0,
        },
        // For papers without decision, show neutral status to authors
        displayStatus: hasDecision
          ? (paper.decision.finalDecision === "accept" ? "accepted" : "rejected")
          : "under_review", // Generic status, doesn't reveal actual review progress
      };
    });

    return {
      chairConferences,
      reviewerConferences,
      authorConferences,
      myPapers,
    };
  },

  /**
   * Get comprehensive stats for a conference
   * @param conferenceId - The conference ID
   * @param userId - The requesting user's ID (for access control)
   * @param isChairOrAdmin - Whether the user is chair or admin
   */
  async getConferenceStats(conferenceId: string, userId?: string, isChairOrAdmin: boolean = false): Promise<ConferenceStats> {
    // Check conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // 1. Paper Counts
    const papers = await prisma.paper.findMany({
      where: { conferenceId },
      select: { status: true },
    });

    const paperStats: PaperStats = {
      total: papers.length,
      submitted: papers.filter((p) => p.status === "submitted").length,
      accepted: papers.filter((p) => p.status === "accepted").length,
      rejected: papers.filter((p) => p.status === "rejected").length,
      cameraReady: papers.filter((p) => p.status === "camera_ready_submitted").length,
    };

    // 2. Review Stats
    // REVIEW artık PAPER'a direkt bağlı değil -> assignment üzerinden geçilmeli
    const reviews = await prisma.review.findMany({
      where: {
        assignment: {
          paper: { conferenceId },
        },
        submittedAt: { not: null },
        score: { not: null },
        confidence: { not: null },
      },
      select: {
        score: true,
        confidence: true,
      },
    });

    const totalReviews = reviews.length;
    let averageScore: number | null = null;
    let averageConfidence: number | null = null;

    if (totalReviews > 0) {
      const totalScore = reviews.reduce((sum, r) => sum + (r.score || 0), 0);
      const totalConfidence = reviews.reduce((sum, r) => sum + (r.confidence || 0), 0);
      averageScore = Math.round((totalScore / totalReviews) * 100) / 100;
      averageConfidence = Math.round((totalConfidence / totalReviews) * 100) / 100;
    }

    const reviewStats: ReviewStats = {
      totalReviews,
      averageScore,
      averageConfidence,
    };

    // 3. Reviewer Load
    const assignments = (await prisma.reviewAssignment.findMany({
      where: {
        paper: { conferenceId },
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
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
        review: {
          select: {
            submittedAt: true,
          },
        },
      },
    } as any)) as any;

    // Group by reviewer - SECURITY: Only show to chair/admin
    let reviewers: ReviewerLoad[] = [];

    if (isChairOrAdmin) {
      const reviewerMap = new Map<string, ReviewerLoad>();

      for (const assignment of assignments) {
        const reviewerId = assignment.reviewer.id;

        if (!reviewerMap.has(reviewerId)) {
          reviewerMap.set(reviewerId, {
            reviewerId,
            firstName: assignment.reviewer.firstName,
            lastName: assignment.reviewer.lastName,
            email: assignment.reviewer.email,
            totalAssigned: 0,
            completedReviews: 0,
          });
        }

        const reviewer = reviewerMap.get(reviewerId)!;
        reviewer.totalAssigned++;

        if (assignment.review?.submittedAt) {
          reviewer.completedReviews++;
        }
      }

      reviewers = Array.from(reviewerMap.values()).sort(
        (a, b) => b.totalAssigned - a.totalAssigned
      );
    }

    // 4. Timeline Overview - Last 10 events
    // SECURITY: Only show timeline to chair/admin
    const timelineEvents: TimelineEvent[] = [];

    if (isChairOrAdmin) {
      // Add review submission events based on assignments
      for (const assignment of assignments) {
        if (assignment.review?.submittedAt) {
          timelineEvents.push({
            type: "review_submitted",
            timestamp: assignment.review.submittedAt,
            description: `Review submitted by ${assignment.reviewer.firstName} ${assignment.reviewer.lastName}`,
            paperId: assignment.paper.id,
            paperTitle: assignment.paper.title,
          });
        }
      }
    }

    // Get decisions - show to chair/admin only with full details
    if (isChairOrAdmin) {
      const decisions = await prisma.decision.findMany({
        where: {
          paper: { conferenceId },
        },
        include: {
          paper: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { decidedAt: "desc" },
        take: 10,
      });

      for (const decision of decisions) {
        timelineEvents.push({
          type: "decision",
          timestamp: decision.decidedAt,
          description: `Decision: ${decision.finalDecision || decision.decision}`,
          paperId: decision.paper.id,
          paperTitle: decision.paper.title,
        });
      }
    }

    // Sort by timestamp and take latest 10
    const timeline = timelineEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      papers: paperStats,
      reviews: reviewStats,
      reviewers,
      timeline,
    };
  },
};

