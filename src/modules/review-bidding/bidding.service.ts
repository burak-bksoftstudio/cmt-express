import { prisma } from "../../config/prisma";
import { BidValue } from "../../generated/prisma/enums";

export const biddingService = {
  /**
   * Submit or update a bid for a paper
   * SECURITY: Uses atomic transaction to prevent race conditions
   */
  async submitBid(paperId: string, reviewerId: string, bid: BidValue) {
    // Use transaction to ensure atomic check-then-bid operation
    return await prisma.$transaction(async (tx) => {
      // Check if paper exists and get author info in one query
      const paper = await tx.paper.findUnique({
        where: { id: paperId },
        include: {
          conference: true,
          authors: {
            select: { userId: true },
          },
        },
      });

      if (!paper) {
        throw new Error("Paper not found");
      }

      // SECURITY: Check if user is an author of this paper (conflict of interest)
      const isAuthor = paper.authors.some((a) => a.userId === reviewerId);
      if (isAuthor) {
        throw new Error("Authors cannot bid on their own papers - conflict of interest");
      }

      // Check if user is a reviewer in this conference
      const membership = await tx.conferenceMember.findFirst({
        where: {
          conferenceId: paper.conferenceId,
          userId: reviewerId,
          role: { in: ["REVIEWER", "CHAIR"] },
        },
      });

      if (!membership) {
        throw new Error("You must be a reviewer in this conference to bid");
      }

      // SECURITY: Check if there's a declared conflict in ReviewerConflict table
      const declaredConflict = await tx.reviewerConflict.findFirst({
        where: {
          paperId,
          userId: reviewerId,
        },
      });

      if (declaredConflict) {
        throw new Error("Cannot bid on paper with declared conflict of interest");
      }

      // Upsert bid (create or update) - all checks passed within same transaction
      const reviewerBid = await tx.reviewerBid.upsert({
        where: {
          paperId_reviewerId: {
            paperId,
            reviewerId,
          },
        },
        update: {
          bid,
          updatedAt: new Date(),
        },
        create: {
          paperId,
          reviewerId,
          bid,
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

      return reviewerBid;
    });
  },

  /**
   * Get reviewer's bid for a specific paper
   */
  async getBid(paperId: string, reviewerId: string) {
    const bid = await prisma.reviewerBid.findUnique({
      where: {
        paperId_reviewerId: {
          paperId,
          reviewerId,
        },
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
          },
        },
      },
    });

    return bid;
  },

  /**
   * Get all bids by a reviewer
   */
  async getMyBids(reviewerId: string) {
    const bids = await prisma.reviewerBid.findMany({
      where: { reviewerId },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
            conference: {
              select: {
                id: true,
                name: true,
              },
            },
            track: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return bids;
  },

  /**
   * Get bidding matrix for a conference (Chair/Admin only)
   */
  async getConferenceBiddingMatrix(conferenceId: string) {
    // Get all papers in this conference
    const papers = await prisma.paper.findMany({
      where: { conferenceId },
      select: {
        id: true,
        title: true,
        track: {
          select: { name: true },
        },
        reviewerBids: {
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
        },
      },
      orderBy: { title: "asc" },
    });

    // Get all reviewers in this conference
    const reviewers = await prisma.conferenceMember.findMany({
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
            email: true,
          },
        },
      },
    });

    // Calculate reviewer statistics
    const reviewerStats = reviewers.map((member) => {
      const userBids = papers.flatMap((p) =>
        p.reviewerBids.filter((b) => b.reviewerId === member.userId)
      );

      return {
        reviewer: member.user,
        totalBids: userBids.length,
        yesBids: userBids.filter((b) => b.bid === "YES").length,
        maybeBids: userBids.filter((b) => b.bid === "MAYBE").length,
        noBids: userBids.filter((b) => b.bid === "NO").length,
        conflictBids: userBids.filter((b) => b.bid === "CONFLICT").length,
      };
    });

    // Build matrix
    const matrix = papers.map((paper) => ({
      paper: {
        id: paper.id,
        title: paper.title,
        track: paper.track?.name,
      },
      bids: paper.reviewerBids.map((bid) => ({
        reviewerId: bid.reviewerId,
        reviewerName: `${bid.reviewer.firstName} ${bid.reviewer.lastName}`,
        bid: bid.bid,
      })),
    }));

    return {
      matrix,
      reviewers: reviewerStats,
      summary: {
        totalPapers: papers.length,
        totalReviewers: reviewers.length,
        papersWithBids: papers.filter((p) => p.reviewerBids.length > 0).length,
        papersWithoutBids: papers.filter((p) => p.reviewerBids.length === 0).length,
      },
    };
  },

  /**
   * Get papers available for bidding in a conference
   */
  async getPapersForBidding(conferenceId: string, reviewerId: string) {
    // Get papers excluding those authored by the reviewer
    const papers = await prisma.paper.findMany({
      where: {
        conferenceId,
        authors: {
          none: {
            userId: reviewerId,
          },
        },
      },
      select: {
        id: true,
        title: true,
        abstract: true,
        track: {
          select: { id: true, name: true },
        },
        keywords: {
          include: {
            keyword: true,
          },
        },
        reviewerBids: {
          where: { reviewerId },
          select: { bid: true },
        },
      },
      orderBy: { title: "asc" },
    });

    return papers.map((paper) => ({
      ...paper,
      currentBid: paper.reviewerBids[0]?.bid || null,
      reviewerBids: undefined,
    }));
  },
};
