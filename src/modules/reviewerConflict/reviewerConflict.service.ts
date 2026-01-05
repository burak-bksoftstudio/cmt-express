import { prisma } from "../../config/prisma";

export const reviewerConflictService = {
  /**
   * Mark a conflict between a reviewer and a paper
   * Only the reviewer themselves can mark this conflict
   */
  async markConflict(paperId: string, userId: string) {
    // Validate paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Check if conflict already exists
    const existingConflict = await prisma.reviewerConflict.findUnique({
      where: {
        paperId_userId: {
          paperId,
          userId,
        },
      },
    });

    if (existingConflict) {
      throw new Error("Conflict already declared");
    }

    // Create conflict
    const conflict = await prisma.reviewerConflict.create({
      data: {
        paperId,
        userId,
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
          },
        },
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

    return conflict;
  },

  /**
   * Remove a conflict between a reviewer and a paper
   * Only the reviewer themselves can unmark this conflict
   */
  async unmarkConflict(paperId: string, userId: string) {
    // Check if conflict exists
    const existingConflict = await prisma.reviewerConflict.findUnique({
      where: {
        paperId_userId: {
          paperId,
          userId,
        },
      },
    });

    if (!existingConflict) {
      throw new Error("Conflict not found");
    }

    // Delete conflict
    await prisma.reviewerConflict.delete({
      where: {
        paperId_userId: {
          paperId,
          userId,
        },
      },
    });

    return { success: true, message: "Conflict removed" };
  },

  /**
   * Get all conflicts for a paper
   * Used by chairs/admins to view declared conflicts
   */
  async getConflictsByPaper(paperId: string) {
    // Validate paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    const conflicts = await prisma.reviewerConflict.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return conflicts;
  },

  /**
   * Check if a reviewer has a conflict with a paper
   * Used internally by assignment logic
   */
  async hasConflict(paperId: string, userId: string): Promise<boolean> {
    const conflict = await prisma.reviewerConflict.findUnique({
      where: {
        paperId_userId: {
          paperId,
          userId,
        },
      },
    });

    return !!conflict;
  },

  /**
   * Get all conflicted user IDs for a paper
   * Used by auto-assignment to filter out conflicted reviewers
   */
  async getConflictedUserIds(paperId: string): Promise<string[]> {
    const conflicts = await prisma.reviewerConflict.findMany({
      where: { paperId },
      select: { userId: true },
    });

    return conflicts.map((c) => c.userId);
  },
};

