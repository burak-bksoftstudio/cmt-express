import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";
import { MemberRole } from "../../generated/prisma/enums";

/**
 * Resolve conferenceId from params/body/query or by looking up paperId
 */
const resolveConferenceId = async (req: Request): Promise<string | null> => {
  const directId =
    (req.params as any).conferenceId ||
    (req.params as any).id ||
    (req.body as any)?.conferenceId ||
    (req.query as any)?.conferenceId;

  if (directId) return String(directId);

  const paperId = (req.params as any)?.paperId || (req.body as any)?.paperId;
  if (paperId) {
    const paper = await prisma.paper.findUnique({
      where: { id: String(paperId) },
      select: { conferenceId: true },
    });
    if (!paper) {
      const error: any = new Error("Paper not found");
      error.statusCode = 404;
      throw error;
    }
    return paper.conferenceId;
  }

  const assignmentId =
    (req.params as any)?.assignmentId || (req.body as any)?.assignmentId;
  if (assignmentId) {
    const reviewAssignment = await prisma.reviewAssignment.findUnique({
      where: { id: String(assignmentId) },
      select: { paper: { select: { conferenceId: true } } },
    });

    if (reviewAssignment?.paper) {
      return reviewAssignment.paper.conferenceId;
    }
  }

  return null;
};

/**
 * Get user's ConferenceMember roles
 * Supports multi-role: a user can have multiple roles in the same conference
 */
export const getUserConferenceRole = async (
  userId: string,
  conferenceId: string
): Promise<{ isChair: boolean; isReviewer: boolean; isAuthor: boolean }> => {
  const members = await prisma.conferenceMember.findMany({
    where: {
      conferenceId,
      userId,
    },
    select: { role: true },
  });

  const roles = members.map((m) => m.role);
  return {
    isChair: roles.includes(MemberRole.CHAIR),
    isReviewer: roles.includes(MemberRole.REVIEWER),
    isAuthor: roles.includes(MemberRole.AUTHOR),
  };
};

/**
 * Generic conference-role guard
 */
const requireConferenceRole =
  (allowedRoles: MemberRole[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isAdmin: true },
      });

      if (!user) {
        res.status(401).json({ success: false, message: "User not authenticated" });
        return;
      }

      if (user.isAdmin) {
        next();
        return;
      }

      const conferenceId = await resolveConferenceId(req);
      if (!conferenceId) {
        res.status(400).json({
          success: false,
          message: "conferenceId is required",
        });
        return;
      }

      const conference = await prisma.conference.findUnique({
        where: { id: conferenceId },
        select: { id: true },
      });

      if (!conference) {
        res.status(404).json({
          success: false,
          message: "Conference not found",
        });
        return;
      }

      const { isChair, isReviewer, isAuthor } = await getUserConferenceRole(
        userId,
        conferenceId
      );

      if (isChair) {
        next();
        return;
      }

      const roleMap: Record<MemberRole, boolean> = {
        [MemberRole.CHAIR]: isChair,
        [MemberRole.REVIEWER]: isReviewer,
        [MemberRole.AUTHOR]: isAuthor,
        [MemberRole.META_REVIEWER]: false, // Meta-reviewer check will be done separately if needed
      };

      const hasAllowedRole = allowedRoles.some((role) => roleMap[role]);

      if (!hasAllowedRole) {
        res.status(403).json({
          success: false,
          message: "Access denied. Insufficient role for this conference.",
        });
        return;
      }

      // If author-level access is requested, ensure the user is author of the paper (when a paperId is present)
      if (
        allowedRoles.includes(MemberRole.AUTHOR) &&
        roleMap[MemberRole.AUTHOR] &&
        !isChair
      ) {
        const paperId = (req.params as any)?.paperId || (req.body as any)?.paperId;
        if (paperId) {
          const isPaperAuthor = await prisma.paperAuthor.findFirst({
            where: {
              paperId: String(paperId),
              userId,
            },
          });

          if (!isPaperAuthor) {
            res.status(403).json({
              success: false,
              message: "Access denied. Only authors of this paper can perform this action.",
            });
            return;
          }
        }
      }

      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authorization failed";
      const status = (error as any)?.statusCode ?? 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  };

/**
 * Admin or Chair of the conference
 */
export const requireAdminOrChair = requireConferenceRole([MemberRole.CHAIR]);

/**
 * Require reviewer membership for the conference (chair also passes)
 */
export const requireReviewer = requireConferenceRole([MemberRole.REVIEWER, MemberRole.CHAIR]);

/**
 * Require author membership for the conference (chair also passes)
 */
export const requireAuthor = requireConferenceRole([MemberRole.AUTHOR]);

/**
 * Require any membership (chair/reviewer/author); useful for general conference access
 */
export const requireConferenceMember = requireConferenceRole([
  MemberRole.CHAIR,
  MemberRole.REVIEWER,
  MemberRole.AUTHOR,
]);

/**
 * Require user to be either the paper author OR chair of the conference
 * Used for camera-ready submissions and other author-specific actions
 */
export const requirePaperAuthorOrChair = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "User not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "User not authenticated" });
      return;
    }

    // Admin bypass
    if (user.isAdmin) {
      next();
      return;
    }

    // Get paperId from params or body
    const paperId = (req.params as any)?.paperId || (req.body as any)?.paperId;
    if (!paperId) {
      res.status(400).json({
        success: false,
        message: "paperId is required",
      });
      return;
    }

    // Get paper and check if it exists
    const paper = await prisma.paper.findUnique({
      where: { id: String(paperId) },
      select: {
        id: true,
        conferenceId: true,
      },
    });

    if (!paper) {
      res.status(404).json({
        success: false,
        message: "Paper not found",
      });
      return;
    }

    // Check if user is chair of the conference
    const { isChair } = await getUserConferenceRole(userId, paper.conferenceId);
    if (isChair) {
      next();
      return;
    }

    // Check if user is author of the paper
    const isPaperAuthor = await prisma.paperAuthor.findFirst({
      where: {
        paperId: String(paperId),
        userId,
      },
    });

    if (!isPaperAuthor) {
      res.status(403).json({
        success: false,
        message: "Access denied. Only paper authors or conference chairs can perform this action.",
      });
      return;
    }

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authorization failed";
    const status = (error as any)?.statusCode ?? 500;
    res.status(status).json({
      success: false,
      message,
    });
  }
};

/**
 * Middleware to verify user is an admin
 * Must be used after verifyAccessToken
 * Checks isAdmin field from database
 */
export const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    if (!user.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
      return;
    }

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authorization failed";
    res.status(500).json({
      success: false,
      message,
    });
  }
};
