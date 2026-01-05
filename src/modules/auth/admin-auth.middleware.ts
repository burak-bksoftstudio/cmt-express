import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";

const ADMIN_SECRET = process.env.JWT_ACCESS_SECRET || "admin-secret-key-2024";

/**
 * Simple admin authentication middleware (bypass Clerk for admin users)
 */
export async function verifyAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Admin authorization required",
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, ADMIN_SECRET) as {
      userId: string;
      isAdmin: boolean;
    };

    // Check if user exists and is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isAdmin: true, email: true },
    });

    if (!user || !user.isAdmin) {
      res.status(403).json({
        success: false,
        message: "Admin access required",
      });
      return;
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid admin token",
    });
  }
}
