import { clerkMiddleware, getAuth, clerkClient } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/prisma";

// Re-export clerkMiddleware for use in server.ts
export { clerkMiddleware };

/**
 * Middleware to verify Clerk session and resolve local User
 * Replaces the old verifyAccessToken middleware
 * Sets req.user.userId with the LOCAL database user ID
 *
 * Uses JIT (Just-In-Time) provisioning: if user doesn't exist in local DB,
 * creates them automatically from Clerk data. This allows auth to work
 * without webhooks (useful for development).
 */
export const verifyClerkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      res.status(401).json({
        success: false,
        message: "Authorization required",
      });
      return;
    }

    // Find local user by Clerk ID
    let user = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
      select: { id: true },
    });

    // JIT Provisioning: Create user if they don't exist
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        const primaryEmail = clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress;

        if (!primaryEmail) {
          res.status(400).json({
            success: false,
            message: "No email address found in Clerk profile",
          });
          return;
        }

        // Check if user exists by email (migration case)
        const existingUser = await prisma.user.findUnique({
          where: { email: primaryEmail },
        });

        if (existingUser) {
          // Link existing user to Clerk
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: { clerkId: auth.userId },
            select: { id: true },
          });
          console.log(`[JIT] Linked existing user ${primaryEmail} to Clerk ID ${auth.userId}`);
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              clerkId: auth.userId,
              email: primaryEmail,
              firstName: clerkUser.firstName || "User",
              lastName: clerkUser.lastName || "",
              passwordHash: null,
            },
            select: { id: true },
          });
          console.log(`[JIT] Created new user ${primaryEmail} with Clerk ID ${auth.userId}`);
        }
      } catch (clerkError) {
        console.error("[JIT] Failed to provision user from Clerk:", clerkError);
        res.status(500).json({
          success: false,
          message: "Failed to provision user account",
        });
        return;
      }
    }

    // Set req.user.userId for compatibility with existing role middleware
    req.user = { userId: user.id };
    next();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    res.status(401).json({
      success: false,
      message,
    });
  }
};
