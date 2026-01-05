import { Router, Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { verifyAdmin } from "../auth/auth.middleware";

const router = Router();

// All routes require authentication and admin role
router.use(verifyClerkAuth);
router.use(verifyAdmin);

/**
 * GET /api/admin/reviews
 * Get all reviews across all conferences
 */
router.get("/reviews", async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        submittedAt: {
          not: null, // Only submitted reviews
        },
      },
      include: {
        assignment: {
          include: {
            paper: {
              select: {
                id: true,
                title: true,
                conference: {
                  select: {
                    id: true,
                    name: true,
                  },
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
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    console.error("Error fetching all reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/conferences
 * Get all conferences (with stats)
 */
router.get("/conferences", async (req: Request, res: Response) => {
  try {
    const conferences = await prisma.conference.findMany({
      include: {
        _count: {
          select: {
            members: true,
            papers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: conferences,
    });
  } catch (error: any) {
    console.error("Error fetching all conferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conferences",
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/stats
 * Get system-wide statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalConferences,
      totalPapers,
      totalReviews,
      pendingRequests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.conference.count(),
      prisma.paper.count(),
      prisma.review.count({ where: { submittedAt: { not: null } } }),
      prisma.conferenceRequest.count({ where: { status: "PENDING" } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalConferences,
        totalPapers,
        totalReviews,
        pendingRequests,
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
});

export default router;
