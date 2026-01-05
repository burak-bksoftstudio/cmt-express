import { prisma } from "../../config/prisma";

// ============================================================================
// TYPES
// ============================================================================

const VALID_FINAL_DECISIONS = ["accept", "reject"] as const;
type FinalDecision = (typeof VALID_FINAL_DECISIONS)[number];

type PaperStage = "submitted" | "under_review" | "decided" | "camera_ready";

interface MakeDecisionData {
  finalDecision: "accept" | "reject";
  comment?: string;
}

interface ReviewScore {
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  score: number | null;
  confidence: number | null;
  submittedAt: Date | null;
}

interface TimelineEvent {
  type:
    | "submitted"
    | "file_uploaded"
    | "review_submitted"
    | "decision"
    | "camera_ready_uploaded"
    | "camera_ready_approved";
  timestamp: Date;
  description: string;
  metadata?: Record<string, unknown>;
}

interface ReviewStats {
  scores: ReviewScore[];
  averageScore: number;
  averageConfidence: number;
  reviewCount: number;
  completedReviewCount: number;
  pendingReviewCount: number;
}

interface DecidedBy {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface DecisionResponse {
  decision: {
    id: string;
    paperId: string;
    decision: string;
    finalDecision: string | null;
    comment: string | null;
    averageScore: number | null;
    averageConfidence: number | null;
    reviewCount: number | null;
    decidedAt: Date;
  };
  paper: {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    conference: {
      id: string;
      name: string;
    };
  };
  stage: PaperStage;
  timeline: TimelineEvent[];
  reviewStats: ReviewStats;
  decidedBy: DecidedBy | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine the current stage of a paper based on its state
 */
async function determinePaperStage(paperId: string): Promise<PaperStage> {
  const paper = (await prisma.paper.findUnique({
    where: { id: paperId },
    include: {
      decision: true,
      reviewAssignments: {
        include: { review: true },
      },
      cameraReadyFiles: {
        where: { status: "approved" },
      },
    },
  } as any)) as any;

  if (!paper) {
    return "submitted";
  }

  // Check for camera ready (accepted + approved camera ready files)
  if (
    paper.decision?.finalDecision === "accept" &&
    paper.cameraReadyFiles.length > 0
  ) {
    return "camera_ready";
  }

  // Check for decision exists
  if (paper.decision) {
    return "decided";
  }

  // Check for reviews submitted
  const submitted = paper.reviewAssignments.filter((a: any) => a.review?.submittedAt);
  if (submitted.length > 0) {
    return "under_review";
  }

  return "submitted";
}

/**
 * Build timeline events for a paper
 * @param paperId - The paper ID
 * @param anonymizeReviewers - If true, hide reviewer names (for authors)
 */
async function buildTimelineEvents(paperId: string, anonymizeReviewers: boolean = false): Promise<TimelineEvent[]> {
  const paper = (await prisma.paper.findUnique({
    where: { id: paperId },
    include: {
      files: {
        orderBy: { createdAt: "asc" },
      },
      reviewAssignments: {
        include: {
          review: true,
          reviewer: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      decision: true,
      cameraReadyFiles: {
        orderBy: { uploadedAt: "asc" },
      },
    },
  } as any)) as any;

  if (!paper) {
    return [];
  }

  const events: TimelineEvent[] = [];

  // Paper submitted
  events.push({
    type: "submitted",
    timestamp: paper.createdAt,
    description: "Paper submitted",
  });

  // Files uploaded
  for (const file of paper.files) {
    events.push({
      type: "file_uploaded",
      timestamp: file.createdAt,
      description: `File uploaded: ${file.fileName}`,
      metadata: { fileName: file.fileName },
    });
  }

  // Reviews submitted - anonymize for authors
  for (const assignment of paper.reviewAssignments) {
    if (assignment.review?.submittedAt) {
      if (anonymizeReviewers) {
        // For authors: hide reviewer identity
        events.push({
          type: "review_submitted",
          timestamp: assignment.review.submittedAt,
          description: "Review submitted",
          metadata: {},
        });
      } else {
        // For chair/admin: show reviewer identity
        const reviewerName = `${assignment.reviewer.firstName} ${assignment.reviewer.lastName}`;
        events.push({
          type: "review_submitted",
          timestamp: assignment.review.submittedAt,
          description: `Review submitted by ${reviewerName}`,
          metadata: {
            reviewerId: assignment.reviewer.id,
            reviewerName,
          },
        });
      }
    }
  }

  // Decision made
  if (paper.decision) {
    events.push({
      type: "decision",
      timestamp: paper.decision.decidedAt,
      description: `Paper ${paper.decision.finalDecision === "accept" ? "accepted" : "rejected"}`,
      metadata: { finalDecision: paper.decision.finalDecision },
    });
  }

  // Camera ready files
  for (const crFile of paper.cameraReadyFiles) {
    events.push({
      type: "camera_ready_uploaded",
      timestamp: crFile.uploadedAt,
      description: `Camera-ready file uploaded: ${crFile.fileName}`,
      metadata: { fileName: crFile.fileName, status: crFile.status },
    });

    if (crFile.decidedAt && crFile.status === "approved") {
      events.push({
        type: "camera_ready_approved",
        timestamp: crFile.decidedAt,
        description: `Camera-ready file approved: ${crFile.fileName}`,
        metadata: { fileName: crFile.fileName },
      });
    }
  }

  // Sort by timestamp
  events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return events;
}

/**
 * Get review statistics for a paper
 * @param paperId - The paper ID
 * @param anonymize - If true, hide reviewer identities and detailed scores (for authors)
 */
async function getReviewStats(paperId: string, anonymize: boolean = false): Promise<ReviewStats> {
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
  } as any)) as any;

  // Calculate statistics from submitted reviews only
  const submittedAssignments = assignments.filter((a: any) =>
    a.review?.score !== null && a.review?.confidence !== null
  );
  const completedReviewCount = submittedAssignments.length;
  const pendingReviewCount = assignments.length - completedReviewCount;

  const totalScore = submittedAssignments.reduce((sum: number, a: any) => sum + (a.review?.score || 0), 0);
  const totalConfidence = submittedAssignments.reduce(
    (sum: number, a: any) => sum + (a.review?.confidence || 0),
    0
  );

  const averageScore =
    completedReviewCount > 0 ? totalScore / completedReviewCount : 0;
  const averageConfidence =
    completedReviewCount > 0 ? totalConfidence / completedReviewCount : 0;

  // For authors: anonymize reviewer information and hide individual scores
  if (anonymize) {
    return {
      scores: [], // Authors don't see individual review scores
      averageScore: 0, // Authors don't see average score
      averageConfidence: 0, // Authors don't see average confidence
      reviewCount: assignments.length,
      completedReviewCount,
      pendingReviewCount,
    };
  }

  // For chair/admin: show full details
  const scores: ReviewScore[] = assignments.map((a: any) => ({
    reviewerId: a.reviewer.id,
    reviewerName: `${a.reviewer.firstName} ${a.reviewer.lastName}`,
    reviewerEmail: a.reviewer.email,
    score: a.review?.score ?? null,
    confidence: a.review?.confidence ?? null,
    submittedAt: a.review?.submittedAt ?? null,
  }));

  return {
    scores,
    averageScore: Math.round(averageScore * 100) / 100,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    reviewCount: scores.length,
    completedReviewCount,
    pendingReviewCount,
  };
}

// ============================================================================
// DECISION SERVICE
// ============================================================================

export const decisionService = {
  /**
   * Make a decision on a paper
   * Admin or Chair of the paper's conference can make decisions
   *
   * @param paperId - The paper ID
   * @param userId - The user making the decision (chair or admin)
   * @param data - Decision data (finalDecision, comment)
   * @returns Enhanced decision response with stats, timeline, and stage
   */
  async makeDecision(
    paperId: string,
    userId: string,
    data: MakeDecisionData
  ): Promise<DecisionResponse> {
    const { finalDecision, comment } = data;

    // Validate finalDecision
    if (!VALID_FINAL_DECISIONS.includes(finalDecision as FinalDecision)) {
      throw new Error(
        `finalDecision must be one of: ${VALID_FINAL_DECISIONS.join(", ")}`
      );
    }

    // Check paper exists with conference info
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        conferenceId: true,
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Check authorization: Admin first, then Chair
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // If not admin, check if user is chair of the paper's conference (multi-role support)
    if (!user.isAdmin) {
      const chairRole = await prisma.conferenceMember.findFirst({
        where: {
          conferenceId: paper.conferenceId,
          userId,
          role: "CHAIR",
        },
      });

      if (!chairRole) {
        throw new Error("Only the chair of this conference can make decisions");
      }
    }

    // Get review statistics
    const reviewStats = await getReviewStats(paperId);

    // Require at least one submitted review
    if (reviewStats.completedReviewCount === 0) {
      throw new Error("No reviews submitted for this paper");
    }

    const now = new Date();

    // Step 1: Create or update Decision record (with audit trail)
    await prisma.decision.upsert({
      where: { paperId },
      create: {
        paperId,
        decision: finalDecision,
        finalDecision,
        comment,
        averageScore: reviewStats.averageScore,
        averageConfidence: reviewStats.averageConfidence,
        reviewCount: reviewStats.completedReviewCount,
        decidedAt: now,
        decidedById: userId, // AUDIT TRAIL: Track who made the decision
      },
      update: {
        decision: finalDecision,
        finalDecision,
        comment,
        averageScore: reviewStats.averageScore,
        averageConfidence: reviewStats.averageConfidence,
        reviewCount: reviewStats.completedReviewCount,
        decidedAt: now,
        decidedById: userId, // AUDIT TRAIL: Update who made the decision
      },
    });

    // Step 2: Update paper status based on decision
    const newStatus = finalDecision === "accept" ? "accepted" : "rejected";
    await prisma.paper.update({
      where: { id: paperId },
      data: { status: newStatus },
    });

    // Step 2.5: Notify paper authors about the decision
    // TODO: Implement email notification system
    // Get all authors of the paper
    const paperAuthors = await prisma.paperAuthor.findMany({
      where: { paperId },
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

    // Log notification (placeholder for actual email system)
    console.log(`[DECISION NOTIFICATION] Paper "${paper.title}" ${finalDecision}`);
    paperAuthors.forEach((author) => {
      console.log(
        `  → Notify ${author.user.firstName} ${author.user.lastName} (${author.user.email})`
      );
    });
    // TODO: Replace with actual email/notification service
    // await notificationService.sendDecisionNotification(paperAuthors, paper, finalDecision, comment);

    // Step 3: Fetch fresh decision
    const freshDecision = await prisma.decision.findUnique({
      where: { paperId },
    });

    if (!freshDecision) {
      throw new Error("Failed to create decision");
    }

    // Step 4: Build timeline and determine stage
    const timeline = await buildTimelineEvents(paperId);
    const stage = await determinePaperStage(paperId);

    // Build response
    const response: DecisionResponse = {
      decision: {
        id: freshDecision.id,
        paperId: freshDecision.paperId,
        decision: freshDecision.decision,
        finalDecision: freshDecision.finalDecision,
        comment: freshDecision.comment,
        averageScore: freshDecision.averageScore,
        averageConfidence: freshDecision.averageConfidence,
        reviewCount: freshDecision.reviewCount,
        decidedAt: freshDecision.decidedAt,
      },
      paper: {
        id: paper.id,
        title: paper.title,
        status: newStatus,
        createdAt: paper.createdAt,
        conference: paper.conference,
      },
      stage,
      timeline,
      reviewStats,
      decidedBy: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };

    return response;
  },

  /**
   * Get decision for a paper with enhanced UI-ready data
   * SECURITY: Validates conference membership before allowing access
   *
   * @param paperId - The paper ID
   * @param userId - The requesting user's ID (for access control)
   * @returns Enhanced decision response with stats, timeline, and stage
   */
  async getDecisionByPaperId(paperId: string, userId?: string): Promise<DecisionResponse | null> {
    // Check paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        conferenceId: true,
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // SECURITY: Verify user has access to this conference
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        const membership = await prisma.conferenceMember.findFirst({
          where: {
            conferenceId: paper.conferenceId,
            userId,
          },
        });

        const isAuthorOfPaper = await prisma.paperAuthor.findFirst({
          where: {
            paperId,
            userId,
          },
        });

        if (!membership && !isAuthorOfPaper) {
          throw new Error("You do not have access to this conference");
        }
      }
    }

    const decision = (await prisma.decision.findUnique({
      where: { paperId },
      include: {
        decidedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })) as any;

    if (!decision) {
      return null;
    }

    // Build timeline and determine stage
    const timeline = await buildTimelineEvents(paperId);
    const stage = await determinePaperStage(paperId);
    const reviewStats = await getReviewStats(paperId);

    const response: DecisionResponse = {
      decision: {
        id: decision.id,
        paperId: decision.paperId,
        decision: decision.decision,
        finalDecision: decision.finalDecision,
        comment: decision.comment,
        averageScore: decision.averageScore,
        averageConfidence: decision.averageConfidence,
        reviewCount: decision.reviewCount,
        decidedAt: decision.decidedAt,
      },
      paper: {
        id: paper.id,
        title: paper.title,
        status: paper.status,
        createdAt: paper.createdAt,
        conference: paper.conference,
      },
      stage,
      timeline,
      reviewStats,
      decidedBy: decision.decidedBy || null, // AUDIT TRAIL: Include who made the decision
    };

    return response;
  },

  /**
   * Get paper info with stage (useful for papers without decision)
   *
   * @param paperId - The paper ID
   * @param userId - The requesting user's ID (for double-blind check)
   * @returns Paper info with stage, timeline, and review stats
   *
   * DOUBLE-BLIND REVIEW:
   * - Authors see anonymized timeline (no reviewer names)
   * - Authors don't see review scores or reviewer info
   * - Only Chair/Admin see full details
   */
  async getPaperDecisionInfo(paperId: string, userId?: string) {
    // Check paper exists with authors
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        conferenceId: true,
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
        authors: {
          select: { userId: true },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // SECURITY: Verify user has access to this conference
    if (userId) {
      const userCheck = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!userCheck?.isAdmin) {
        const membership = await prisma.conferenceMember.findFirst({
          where: {
            conferenceId: paper.conferenceId,
            userId,
          },
        });

        const isAuthorOfPaper = await prisma.paperAuthor.findFirst({
          where: {
            paperId,
            userId,
          },
        });

        if (!membership && !isAuthorOfPaper) {
          throw new Error("You do not have access to this conference");
        }
      }
    }

    // Check if requesting user is an author
    const isAuthor = userId ? paper.authors.some((a) => a.userId === userId) : false;

    // Check if user is chair or admin
    let isChairOrAdmin = false;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (user?.isAdmin) {
        isChairOrAdmin = true;
      } else {
        const chairRole = await prisma.conferenceMember.findFirst({
          where: {
            conferenceId: paper.conferenceId,
            userId,
            role: "CHAIR",
          },
        });
        isChairOrAdmin = !!chairRole;
      }
    }

    // Determine if we should anonymize (author who is not chair/admin)
    const shouldAnonymize = isAuthor && !isChairOrAdmin;

    // Get decision if exists
    const decision = await prisma.decision.findUnique({
      where: { paperId },
    });

    // Build timeline and determine stage (with anonymization for authors)
    const timeline = await buildTimelineEvents(paperId, shouldAnonymize);
    const stage = await determinePaperStage(paperId);
    const reviewStats = await getReviewStats(paperId, shouldAnonymize);

    // For authors: hide decision scores (they only know accept/reject)
    const decisionResponse = decision
      ? {
          id: decision.id,
          paperId: decision.paperId,
          decision: decision.decision,
          finalDecision: decision.finalDecision,
          comment: shouldAnonymize ? null : decision.comment, // Hide chair comments from authors
          averageScore: shouldAnonymize ? null : decision.averageScore,
          averageConfidence: shouldAnonymize ? null : decision.averageConfidence,
          reviewCount: shouldAnonymize ? null : decision.reviewCount,
          decidedAt: decision.decidedAt,
        }
      : null;

    return {
      paper: {
        id: paper.id,
        title: paper.title,
        status: paper.status,
        createdAt: paper.createdAt,
        conference: paper.conference,
      },
      decision: decisionResponse,
      stage,
      timeline,
      reviewStats,
      hasDecision: !!decision,
      isAuthor, // Include for frontend to know if user is author
      canSeeFullDetails: !shouldAnonymize, // Include for frontend to adjust UI
    };
  },

  /**
   * Get all decisions for a conference (with audit trail)
   */
  async getDecisionsByConference(conferenceId: string) {
    const decisions = await prisma.decision.findMany({
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
        decidedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { decidedAt: "desc" },
    });

    return decisions;
  },
};
