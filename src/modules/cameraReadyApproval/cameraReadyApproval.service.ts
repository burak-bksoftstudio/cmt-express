import { prisma } from "../../config/prisma";

export const cameraReadyApprovalService = {
  /**
   * Approve camera-ready file for a paper
   * Only Admin or Chair of the conference can approve
   */
  async approve(paperId: string, userId: string) {
    // Fetch paper with conference info and camera-ready files
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        cameraReadyFiles: {
          orderBy: { uploadedAt: "desc" },
        },
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

    // Check paper has at least 1 camera-ready file
    if (paper.cameraReadyFiles.length === 0) {
      throw new Error("No camera-ready files uploaded for this paper");
    }

    // Check if user is admin or chair of the conference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let isAuthorized = false;

    if (user.isAdmin) {
      isAuthorized = true;
    } else {
      // Check if user is chair of this conference
      const chairRole = await prisma.conferenceMember.findFirst({
        where: {
          conferenceId: paper.conferenceId,
          userId,
          role: "CHAIR",
        },
      });

      if (chairRole) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error("Only admin or chair can approve camera-ready files");
    }

    // Get the latest camera-ready file
    const latestFile = paper.cameraReadyFiles[0];

    const now = new Date();

    // Update camera-ready file status and paper status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update camera-ready file
      const updatedFile = await tx.cameraReadyFile.update({
        where: { id: latestFile.id },
        data: {
          status: "approved",
          decidedAt: now,
        },
      });

      // Update paper status
      await tx.paper.update({
        where: { id: paperId },
        data: {
          status: "camera_ready_approved",
        },
      });

      return updatedFile;
    });

    // Fetch updated file with paper info
    const finalResult = await prisma.cameraReadyFile.findUnique({
      where: { id: result.id },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            status: true,
            conference: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return finalResult;
  },

  /**
   * Reject camera-ready file for a paper (needs revision)
   * Only Admin or Chair of the conference can reject
   */
  async reject(paperId: string, userId: string, comment: string) {
    // Fetch paper with conference info and camera-ready files
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        cameraReadyFiles: {
          orderBy: { uploadedAt: "desc" },
        },
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

    // Check paper has at least 1 camera-ready file
    if (paper.cameraReadyFiles.length === 0) {
      throw new Error("No camera-ready files uploaded for this paper");
    }

    // Check if user is admin or chair of the conference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    let isAuthorized = false;

    if (user.isAdmin) {
      isAuthorized = true;
    } else {
      // Check if user is chair of this conference
      const chairRole = await prisma.conferenceMember.findFirst({
        where: {
          conferenceId: paper.conferenceId,
          userId,
          role: "CHAIR",
        },
      });

      if (chairRole) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error("Only admin or chair can reject camera-ready files");
    }

    // Get the latest camera-ready file
    const latestFile = paper.cameraReadyFiles[0];

    const now = new Date();

    // Update camera-ready file status and paper status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update camera-ready file
      const updatedFile = await tx.cameraReadyFile.update({
        where: { id: latestFile.id },
        data: {
          status: "needs_revision",
          reviewerComment: comment,
          decidedAt: now,
        },
      });

      // Update paper status
      await tx.paper.update({
        where: { id: paperId },
        data: {
          status: "camera_ready_needs_revision",
        },
      });

      return updatedFile;
    });

    // Fetch updated file with paper info
    const finalResult = await prisma.cameraReadyFile.findUnique({
      where: { id: result.id },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            status: true,
            conference: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return finalResult;
  },

  /**
   * Get camera-ready status for a paper
   * SECURITY: Validates conference membership before allowing access
   */
  async getStatus(paperId: string, userId?: string) {
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        cameraReadyFiles: {
          orderBy: { uploadedAt: "desc" },
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

    return {
      paperId: paper.id,
      paperStatus: paper.status,
      cameraReadyFiles: paper.cameraReadyFiles,
    };
  },
};

