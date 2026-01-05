import { prisma } from "../../config/prisma";
import { ReviewStatus, BidValue } from "../../generated/prisma/enums";

// Bid score mapping for auto-assignment
const BID_SCORES: Record<BidValue, number> = {
  YES: 3,
  MAYBE: 2,
  NO: 0,
  CONFLICT: -999,
};

export const assignmentService = {
  /**
   * Create a new review assignment
   */
  async createAssignment(
    paperId: string,
    reviewerId: string,
    dueDate?: Date
  ) {
    // Check if paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: { conference: true },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Check if reviewer exists and is a member of the conference
    const membership = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId: paper.conferenceId,
        userId: reviewerId,
        role: { in: ["REVIEWER", "CHAIR"] },
      },
    });

    if (!membership) {
      throw new Error("Reviewer is not a member of this conference");
    }

    // SECURITY: Check if reviewer is an author of this paper (conflict)
    const isAuthor = await prisma.paperAuthor.findFirst({
      where: {
        paperId,
        userId: reviewerId,
      },
    });

    if (isAuthor) {
      throw new Error("Cannot assign paper to its own author - conflict of interest");
    }

    // SECURITY: Check if there's a declared CONFLICT in ReviewerConflict table
    const declaredConflict = await prisma.reviewerConflict.findFirst({
      where: {
        paperId,
        userId: reviewerId,
      },
    });

    if (declaredConflict) {
      throw new Error("Cannot assign paper to reviewer with declared conflict of interest");
    }

    // SECURITY: Check if there's a CONFLICT bid
    const conflictBid = await prisma.reviewerBid.findFirst({
      where: {
        paperId,
        reviewerId,
        bid: "CONFLICT",
      },
    });

    if (conflictBid) {
      throw new Error("Cannot assign paper to reviewer who marked conflict in bidding");
    }

    // Check for duplicate assignment
    const existingAssignment = await prisma.reviewAssignment.findUnique({
      where: {
        paperId_reviewerId: {
          paperId,
          reviewerId,
        },
      },
    });

    if (existingAssignment) {
      throw new Error("Assignment already exists for this paper and reviewer");
    }

    // Create assignment
    const assignment = await prisma.reviewAssignment.create({
      data: {
        paperId,
        reviewerId,
        status: "NOT_STARTED",
        dueDate,
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            conference: {
              select: { id: true, name: true },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Update paper status to "under_review" when first assignment is made
    if (paper.status === "submitted") {
      await prisma.paper.update({
        where: { id: paperId },
        data: { status: "under_review" },
      });
    }

    return assignment;
  },

  /**
   * Delete an assignment
   */
  async deleteAssignment(assignmentId: string) {
    const assignment = await prisma.reviewAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Check if review is already submitted
    if (assignment.status === "SUBMITTED") {
      throw new Error("Cannot delete assignment with submitted review");
    }

    await prisma.reviewAssignment.delete({
      where: { id: assignmentId },
    });

    return { success: true, message: "Assignment deleted" };
  },

  /**
   * Get assignments for a paper
   */
  async getAssignmentsForPaper(paperId: string) {
    const assignments = await prisma.reviewAssignment.findMany({
      where: { paperId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return assignments;
  },

  /**
   * Get reviewer's assigned papers
   */
  async getMyAssignments(reviewerId: string) {
    const assignments = await prisma.reviewAssignment.findMany({
      where: { reviewerId },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
            status: true,
            conference: {
              select: { id: true, name: true },
            },
            track: {
              select: { id: true, name: true },
            },
            authors: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: { order: "asc" },
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
        // Include review if exists
        review: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return assignments;
  },

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(assignmentId: string, status: ReviewStatus) {
    const assignment = await prisma.reviewAssignment.update({
      where: { id: assignmentId },
      data: { status },
      include: {
        paper: {
          select: { id: true, title: true },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return assignment;
  },

  /**
   * Auto-assign reviewers for a conference
   */
  async autoAssignReviewers(
    conferenceId: string,
    targetReviewersPerPaper: number = 3
  ) {
    // Get all papers in the conference with conflicts
    const papers = await prisma.paper.findMany({
      where: { conferenceId },
      include: {
        authors: true,
        reviewAssignments: true,
        reviewerBids: true,
        conflicts: true, // Include declared conflicts
      },
    });

    // Get all reviewers in the conference
    const reviewerMembers = await prisma.conferenceMember.findMany({
      where: {
        conferenceId,
        role: { in: ["REVIEWER", "CHAIR"] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get current assignment counts per reviewer
    const reviewerLoads: Record<string, number> = {};
    reviewerMembers.forEach((m) => {
      reviewerLoads[m.userId] = 0;
    });

    // Count existing assignments
    const existingAssignments = await prisma.reviewAssignment.findMany({
      where: {
        paper: { conferenceId },
      },
    });

    existingAssignments.forEach((a) => {
      if (reviewerLoads[a.reviewerId] !== undefined) {
        reviewerLoads[a.reviewerId]++;
      }
    });

    const assigned: any[] = [];
    const skipped: any[] = [];

    // Process each paper
    for (const paper of papers) {
      const currentAssignmentCount = paper.reviewAssignments.length;
      const neededAssignments = targetReviewersPerPaper - currentAssignmentCount;

      if (neededAssignments <= 0) {
        skipped.push({
          paperId: paper.id,
          title: paper.title,
          reason: "Already has enough reviewers",
        });
        continue;
      }

      // Get author IDs for this paper (to exclude)
      const authorIds = new Set(paper.authors.map((a) => a.userId));

      // Get already assigned reviewer IDs
      const assignedReviewerIds = new Set(
        paper.reviewAssignments.map((a) => a.reviewerId)
      );

      // SECURITY: Get declared conflict IDs (to exclude)
      const conflictUserIds = new Set(paper.conflicts.map((c) => c.userId));

      // Build candidate list with scores
      const candidates: { reviewerId: string; score: number; load: number }[] = [];

      for (const member of reviewerMembers) {
        const reviewerId = member.userId;

        // Skip if already assigned
        if (assignedReviewerIds.has(reviewerId)) continue;

        // SECURITY: Skip if author (conflict of interest)
        if (authorIds.has(reviewerId)) continue;

        // SECURITY: Skip if has declared conflict
        if (conflictUserIds.has(reviewerId)) continue;

        // Get bid for this paper
        const bid = paper.reviewerBids.find((b) => b.reviewerId === reviewerId);
        const bidScore = bid ? BID_SCORES[bid.bid] : 1; // Default score of 1 if no bid

        // Skip if conflict bid
        if (bidScore === -999) continue;

        candidates.push({
          reviewerId,
          score: bidScore,
          load: reviewerLoads[reviewerId] || 0,
        });
      }

      // Sort candidates by: 1) bid score (descending), 2) current load (ascending)
      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.load - b.load;
      });

      // Assign top candidates
      const assignedForPaper: string[] = [];
      for (let i = 0; i < neededAssignments && i < candidates.length; i++) {
        const candidate = candidates[i];
        assignedForPaper.push(candidate.reviewerId);
        reviewerLoads[candidate.reviewerId] =
          (reviewerLoads[candidate.reviewerId] || 0) + 1;
      }

      if (assignedForPaper.length > 0) {
        assigned.push({
          paperId: paper.id,
          title: paper.title,
          assignedReviewers: assignedForPaper,
        });
      } else if (neededAssignments > 0) {
        skipped.push({
          paperId: paper.id,
          title: paper.title,
          reason: "No eligible reviewers available",
        });
      }
    }

    // Create all assignments in a transaction
    const createdAssignments = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of assigned) {
        for (const reviewerId of item.assignedReviewers) {
          const assignment = await tx.reviewAssignment.create({
            data: {
              paperId: item.paperId,
              reviewerId,
              status: "NOT_STARTED",
            },
          });
          results.push(assignment);
        }
      }

      return results;
    });

    return {
      success: true,
      totalAssigned: createdAssignments.length,
      assigned,
      skipped,
      reviewerLoads: Object.entries(reviewerLoads).map(([id, load]) => {
        const member = reviewerMembers.find((m) => m.userId === id);
        return {
          reviewerId: id,
          name: member
            ? `${member.user.firstName} ${member.user.lastName}`
            : "Unknown",
          assignedPapers: load,
        };
      }),
    };
  },

  /**
   * Get assignment statistics for a conference
   */
  async getConferenceAssignmentStats(conferenceId: string) {
    const papers = await prisma.paper.findMany({
      where: { conferenceId },
      include: {
        reviewAssignments: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const reviewerMembers = await prisma.conferenceMember.findMany({
      where: {
        conferenceId,
        role: { in: ["REVIEWER", "CHAIR"] },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate stats
    const paperStats = papers.map((p) => ({
      paperId: p.id,
      title: p.title,
      assignedReviewers: p.reviewAssignments.length,
      assignments: p.reviewAssignments.map((a) => ({
        assignmentId: a.id, // Include assignment ID for deletion
        reviewerId: a.reviewerId,
        reviewerName: `${a.reviewer.firstName} ${a.reviewer.lastName}`,
        status: a.status,
      })),
    }));

    const reviewerStats = reviewerMembers.map((m) => {
      const assignments = papers.flatMap((p) =>
        p.reviewAssignments.filter((a) => a.reviewerId === m.userId)
      );
      return {
        reviewerId: m.userId,
        name: `${m.user.firstName} ${m.user.lastName}`,
        totalAssigned: assignments.length,
        notStarted: assignments.filter((a) => a.status === "NOT_STARTED").length,
        inProgress: assignments.filter((a) => a.status === "DRAFT").length,
        completed: assignments.filter((a) => a.status === "SUBMITTED").length,
      };
    });

    return {
      papers: paperStats,
      reviewers: reviewerStats,
      summary: {
        totalPapers: papers.length,
        papersWithAssignments: papers.filter((p) => p.reviewAssignments.length > 0).length,
        papersWithoutAssignments: papers.filter((p) => p.reviewAssignments.length === 0).length,
        totalAssignments: papers.reduce((sum, p) => sum + p.reviewAssignments.length, 0),
        averageReviewersPerPaper:
          papers.length > 0
            ? (
                papers.reduce((sum, p) => sum + p.reviewAssignments.length, 0) /
                papers.length
              ).toFixed(1)
            : "0",
      },
    };
  },
};
