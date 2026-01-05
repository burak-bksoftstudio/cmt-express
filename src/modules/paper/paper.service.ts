import { prisma } from "../../config/prisma";
import { s3Service } from "../s3/s3.service";
import { enforceDeadline } from "../../utils/deadline";
import { paperVersionService } from "../paper-version/paper-version.service";

interface CreatePaperData {
  conferenceId: string;
  trackId?: string;
  title: string;
  abstract?: string;
  keywords?: string[];
}

interface AuthorData {
  firstName: string;
  lastName: string;
  email: string;
  order: number;
}

export const paperService = {
  /**
   * Create a new paper
   */
  async createPaper(userId: string, data: CreatePaperData) {
    const { conferenceId, trackId, title, abstract, keywords } = data;

    if (!conferenceId) {
      throw new Error("conferenceId is required");
    }

    if (!title) {
      throw new Error("title is required");
    }

    // Check if conference exists
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
      include: {
        settings: true,
      },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Check if track exists (if provided)
    if (trackId) {
      const track = await prisma.track.findUnique({
        where: { id: trackId },
      });
      if (!track) {
        throw new Error("Track not found");
      }
      if (track.conferenceId !== conferenceId) {
        throw new Error("Track does not belong to this conference");
      }
    }

    // Load user to check admin status
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Enforce submission deadline
    enforceDeadline(conference.settings?.submissionDeadline ?? null, user.isAdmin);

    // Create paper and author in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create paper
      const paper = await tx.paper.create({
        data: {
          conferenceId,
          trackId,
          title,
          abstract,
          status: "submitted",
        },
      });

      // Create paper author (current user as first author)
      await tx.paperAuthor.create({
        data: {
          paperId: paper.id,
          userId,
          order: 1,
        },
      });

      // Auto-assign AUTHOR role to the user in this conference
      // Check if user already has AUTHOR role specifically
      const existingAuthorRole = await tx.conferenceMember.findUnique({
        where: {
          conferenceId_userId_role: {
            conferenceId,
            userId,
            role: "AUTHOR",
          },
        },
      });

      if (!existingAuthorRole) {
        // User doesn't have AUTHOR role yet, assign it
        // They may have other roles (REVIEWER, CHAIR) - multi-role support
        await tx.conferenceMember.create({
          data: {
            conferenceId,
            userId,
            role: "AUTHOR",
          },
        });
      }

      // Create keywords if provided
      if (keywords && keywords.length > 0) {
        for (const keywordName of keywords) {
          // Find or create keyword
          const keyword = await tx.keyword.upsert({
            where: { name: keywordName.toLowerCase().trim() },
            update: {},
            create: { name: keywordName.toLowerCase().trim() },
          });

          // Link keyword to paper
          await tx.paperKeyword.create({
            data: {
              paperId: paper.id,
              keywordId: keyword.id,
            },
          });
        }
      }

      // Return paper with authors
      const paperWithAuthors = await tx.paper.findUnique({
        where: { id: paper.id },
        include: {
          authors: {
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
            orderBy: { order: "asc" },
          },
          conference: {
            select: {
              id: true,
              name: true,
            },
          },
          track: true,
          keywords: {
            include: {
              keyword: true,
            },
          },
        },
      });

      return paperWithAuthors;
    });

    return result;
  },

  /**
   * Upload a paper file to S3 and save DB record
   */
  async uploadPaperFile(
    paperId: string,
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    userId?: string
  ) {
    // Check if paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Upload to S3
    const upload = await s3Service.uploadFile(buffer, fileName, mimeType);

    // Save file record and create version snapshot in transaction
    const result = await prisma.$transaction(async (tx) => {
      const savedFile = await tx.paperFile.create({
        data: {
          paperId,
          fileName,
          mimeType,
          fileKey: upload.key,
          fileUrl: upload.url,
        },
      });

      // Create version snapshot
      await paperVersionService.createVersion({
        paperId,
        versionType: "SUBMISSION",
        title: paper.title,
        abstract: paper.abstract || undefined,
        fileUrl: upload.url,
        fileKey: upload.key,
        fileName: fileName,
        createdBy: userId,
        notes: "Initial submission",
      });

      return savedFile;
    });

    return result;
  },

  /**
   * Get a paper by ID with all related data
   * @param paperId - Paper ID
   * @param userId - Current user ID (for double-blind anonymization)
   * @param isChairOrAdmin - Whether user has Chair/Admin access
   * SECURITY: Validates conference membership before allowing access
   */
  async getPaperById(paperId: string, userId?: string, isChairOrAdmin: boolean = false) {
    const paper = (await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
        track: true,
        authors: {
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
          orderBy: { order: "asc" },
        },
        keywords: {
          include: {
            keyword: true,
          },
        },
        files: true,
        reviewAssignments: {
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
        },
        reviewerBids: {
          include: {
            reviewer: {
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
    } as any)) as any;

    if (!paper) {
      throw new Error("Paper not found");
    }

    // SECURITY: Verify user has access to this conference
    if (userId && !isChairOrAdmin) {
      // Check if user is a conference member OR an author of any paper in this conference
      const membership = await prisma.conferenceMember.findFirst({
        where: {
          conferenceId: paper.conference.id,
          userId,
        },
      });

      const isAuthorOfAnyPaper = await prisma.paperAuthor.findFirst({
        where: {
          userId,
          paper: {
            conferenceId: paper.conference.id,
          },
        },
      });

      if (!membership && !isAuthorOfAnyPaper) {
        throw new Error("You do not have access to this conference");
      }
    }

    // Check if user is an author of this paper
    const isAuthor = userId ? paper.authors.some((a: any) => a.userId === userId) : false;

    // Check if decision has been made (paper is accepted or rejected)
    const hasDecision = paper.status === 'accepted' || paper.status === 'rejected';

    // Double-blind review logic for authors
    if (isAuthor && !isChairOrAdmin) {
      if (!hasDecision) {
        // BEFORE DECISION: Authors should NOT see any review information
        paper.reviewAssignments = [];
        paper.reviewerBids = [];
      } else {
        // AFTER DECISION: Authors can only see commentsToAuthor, nothing else
        paper.reviewAssignments = paper.reviewAssignments.map((assignment: any) => ({
          id: assignment.id,
          paperId: assignment.paperId,
          status: assignment.status,
          createdAt: assignment.createdAt,
          reviewer: { id: "anonymous" }, // Always anonymous for authors
          review: assignment.review ? {
            id: assignment.review.id,
            assignmentId: assignment.review.assignmentId,
            commentsToAuthor: assignment.review.commentsToAuthor,
            submittedAt: assignment.review.submittedAt,
            // HIDDEN from authors: score, confidence, strengths, weaknesses, summary, commentsToChair
          } : null,
        }));
        paper.reviewerBids = []; // Authors never see bids
      }
    } else if (!isChairOrAdmin) {
      // Non-author, non-chair users (e.g., other reviewers)
      // Anonymize reviewer identities but show review content they're allowed to see
      if (paper.reviewAssignments) {
        paper.reviewAssignments = paper.reviewAssignments.map((assignment: any) => ({
          ...assignment,
          reviewer: {
            id: assignment.reviewerId === userId ? userId : "anonymous",
            // Only show own identity
          },
        }));
      }

      // Anonymize reviewer bids for non-chair users
      if (paper.reviewerBids) {
        paper.reviewerBids = paper.reviewerBids.map((bid: any) => ({
          ...bid,
          reviewer: {
            id: bid.reviewerId === userId ? userId : "anonymous",
          },
        }));
      }
    }
    // Chair/Admin: See everything (no modifications needed)

    // Transform reviewAssignments to reviews for frontend compatibility
    // Frontend expects paper.reviews array with Review objects
    const reviews = paper.reviewAssignments
      .filter((assignment: any) => assignment.review)
      .map((assignment: any) => ({
        ...assignment.review,
        assignment: {
          id: assignment.id,
          paperId: assignment.paperId,
          reviewerId: assignment.reviewerId,
          status: assignment.status,
          dueDate: assignment.dueDate,
          createdAt: assignment.createdAt,
          reviewer: assignment.reviewer,
        },
      }));

    // Add assignments array (for assignment panel) and reviews array (for reviews section)
    return {
      ...paper,
      reviews,
      assignments: paper.reviewAssignments,
    };
  },

  /**
   * Get all papers for a user (as author)
   */
  async getMyPapers(userId: string, conferenceId?: string) {
    const whereClause: any = {
      authors: {
        some: {
          userId,
        },
      },
    };

    if (conferenceId) {
      whereClause.conferenceId = conferenceId;
    }

    const papers = await prisma.paper.findMany({
      where: whereClause,
      include: {
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
        track: true,
        authors: {
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
          orderBy: { order: "asc" },
        },
        keywords: {
          include: {
            keyword: true,
          },
        },
        files: true,
        cameraReadyFiles: {
          orderBy: { uploadedAt: "asc" },
        },
        _count: {
          select: {
            reviewAssignments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return papers;
  },

  /**
   * Add authors to a paper
   */
  async addAuthors(paperId: string, userId: string, authors: AuthorData[]) {
    // Check if paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        authors: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Check if user is an author of the paper
    const isAuthor = paper.authors.some((a) => a.userId === userId);
    if (!isAuthor) {
      throw new Error("You are not authorized to add authors to this paper");
    }

    // Delete existing authors (except the primary)
    await prisma.paperAuthor.deleteMany({
      where: {
        paperId,
        order: { gt: 1 },
      },
    });

    // Add new authors
    const createdAuthors = [];
    for (const authorData of authors) {
      if (authorData.order === 1) continue; // Skip primary author

      // Find or create user by email
      let authorUser = await prisma.user.findUnique({
        where: { email: authorData.email },
      });

      if (!authorUser) {
        // Create a placeholder user (they can register later)
        authorUser = await prisma.user.create({
          data: {
            email: authorData.email,
            firstName: authorData.firstName,
            lastName: authorData.lastName,
            passwordHash: "", // Empty password - user needs to register
          },
        });
      }

      // Create paper author relationship
      const paperAuthor = await prisma.paperAuthor.create({
        data: {
          paperId,
          userId: authorUser.id,
          order: authorData.order,
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

      createdAuthors.push(paperAuthor);
    }

    // Return updated paper with all authors
    // Author is adding co-authors, so don't show reviewer info (double-blind)
    return this.getPaperById(paperId, userId, false);
  },

  /**
   * Update paper metadata (title, abstract, keywords)
   * Only allowed before review starts and before submission deadline
   */
  async updatePaper(
    paperId: string,
    userId: string,
    data: {
      title?: string;
      abstract?: string;
      keywords?: string[];
      trackId?: string;
    }
  ) {
    // Get paper with conference settings
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        authors: true,
        conference: {
          include: {
            settings: true,
          },
        },
        reviewAssignments: true,
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Check if user is an author
    const isAuthor = paper.authors.some((a) => a.userId === userId);
    if (!isAuthor) {
      throw new Error("Only paper authors can edit this paper");
    }

    // Check if paper status allows editing (only "submitted" papers can be edited)
    if (paper.status !== "submitted") {
      throw new Error(`Cannot edit paper with status "${paper.status}". Only submitted papers can be edited.`);
    }

    // Check if reviews have started (if any review assignments exist)
    if (paper.reviewAssignments && paper.reviewAssignments.length > 0) {
      throw new Error("Cannot edit paper after review assignments have been made");
    }

    // Check submission deadline (if set)
    const submissionDeadline = paper.conference.settings?.submissionDeadline;
    if (submissionDeadline) {
      const now = new Date();
      if (now > submissionDeadline) {
        throw new Error("Cannot edit paper after submission deadline has passed");
      }
    }

    // Update paper
    const updatedPaper = await prisma.paper.update({
      where: { id: paperId },
      data: {
        title: data.title,
        abstract: data.abstract,
        trackId: data.trackId,
        updatedAt: new Date(),
      },
    });

    // Update keywords if provided
    if (data.keywords !== undefined) {
      // Delete existing keywords
      await prisma.paperKeyword.deleteMany({
        where: { paperId },
      });

      // Add new keywords (with normalization - lowercase + trim)
      if (data.keywords.length > 0) {
        for (const keywordName of data.keywords) {
          // Normalize keyword: lowercase and trim (consistent with createPaper)
          const normalizedKeyword = keywordName.toLowerCase().trim();
          
          // Find or create keyword using upsert (consistent with createPaper)
          const keyword = await prisma.keyword.upsert({
            where: { name: normalizedKeyword },
            update: {},
            create: { name: normalizedKeyword },
          });

          // Create paper-keyword relationship
          await prisma.paperKeyword.create({
            data: {
              paperId,
              keywordId: keyword.id,
            },
          });
        }
      }
    }

    // Return updated paper (without reviewer info)
    return this.getPaperById(paperId, userId, false);
  },

  /**
   * Get all papers (admin only)
   */
  async getAllPapers(conferenceId?: string) {
    const whereClause: any = {};

    if (conferenceId) {
      whereClause.conferenceId = conferenceId;
    }

    const papers = await prisma.paper.findMany({
      where: whereClause,
      include: {
        conference: {
          select: {
            id: true,
            name: true,
          },
        },
        track: true,
        authors: {
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
          orderBy: { order: "asc" },
        },
        keywords: {
          include: {
            keyword: true,
          },
        },
        _count: {
          select: {
            reviewAssignments: true,
            files: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return papers;
  },

  /**
   * Delete a paper file
   * Only authors can delete files before review assignments are made
   */
  async deletePaperFile(paperId: string, fileId: string, userId: string) {
    // Get paper with file info
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        files: true,
        authors: {
          select: { userId: true },
        },
        reviewAssignments: true,
        conference: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Check if user is an author
    const isAuthor = paper.authors.some((a) => a.userId === userId);
    if (!isAuthor) {
      throw new Error("Only paper authors can delete files");
    }

    // Check if file exists
    const file = paper.files.find((f) => f.id === fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Check if reviews have started
    if (paper.reviewAssignments && paper.reviewAssignments.length > 0) {
      throw new Error("Cannot delete file after review assignments have been made");
    }

    // Check submission deadline
    const submissionDeadline = paper.conference.settings?.submissionDeadline;
    if (submissionDeadline) {
      const now = new Date();
      if (now > submissionDeadline) {
        throw new Error("Cannot delete file after submission deadline has passed");
      }
    }

    // Delete from S3
    await s3Service.deleteFile(file.fileKey);

    // Delete from database
    await prisma.paperFile.delete({
      where: { id: fileId },
    });

    return { success: true, message: "File deleted successfully" };
  },

  /**
   * Generate a presigned download URL for a paper file
   * Authorization: Authors, reviewers assigned to the paper, conference chairs, admins
   */
  async generateDownloadUrl(paperId: string, userId: string) {
    // Get paper with file and conference info
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        files: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        authors: {
          select: { userId: true },
        },
        reviewAssignments: {
          select: { reviewerId: true },
        },
        conference: {
          select: { id: true },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    if (paper.files.length === 0) {
      throw new Error("No file uploaded for this paper");
    }

    const file = paper.files[0];

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    const isAdmin = user?.isAdmin || false;
    const isAuthor = paper.authors.some((a) => a.userId === userId);
    const isReviewer = paper.reviewAssignments.some((r) => r.reviewerId === userId);

    // Check if user is a conference chair
    const conferenceMember = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId: paper.conference.id,
        userId,
        role: "CHAIR",
      },
    });
    const isChair = !!conferenceMember;

    // Allow access if user is: admin, author, reviewer, or chair
    if (!isAdmin && !isAuthor && !isReviewer && !isChair) {
      throw new Error("Access denied");
    }

    // Generate presigned URL
    const downloadUrl = await s3Service.getDownloadPresignedUrl(file.fileKey);

    return downloadUrl;
  },
};
