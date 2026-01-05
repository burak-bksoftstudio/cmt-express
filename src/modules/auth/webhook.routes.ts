import { Router, Request, Response } from "express";
import { Webhook } from "svix";
import { prisma } from "../../config/prisma";

const router = Router();

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

/**
 * POST /api/webhooks/clerk
 * Handles Clerk webhook events for user sync
 */
router.post("/clerk", async (req: Request, res: Response) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  // Get Svix headers for verification
  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: "Missing svix headers" });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;

  try {
    // Verify the webhook signature
    evt = wh.verify(JSON.stringify(req.body), {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const { type, data } = evt;

  try {
    if (type === "user.created") {
      const primaryEmail = data.email_addresses.find(
        (e) => e.id === data.primary_email_address_id
      )?.email_address;

      if (!primaryEmail) {
        return res.status(400).json({ error: "No primary email found" });
      }

      // Check if user with this email already exists (migration case)
      const existingUser = await prisma.user.findUnique({
        where: { email: primaryEmail },
      });

      if (existingUser) {
        // Link existing user to Clerk
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { clerkId: data.id },
        });
        console.log(`Linked existing user ${primaryEmail} to Clerk ID ${data.id}`);
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            clerkId: data.id,
            email: primaryEmail,
            firstName: data.first_name || "User",
            lastName: data.last_name || "",
            passwordHash: null,
          },
        });
        console.log(`Created new user ${primaryEmail} with Clerk ID ${data.id}`);
      }
    }

    if (type === "user.updated") {
      const primaryEmail = data.email_addresses.find(
        (e) => e.id === data.primary_email_address_id
      )?.email_address;

      if (primaryEmail) {
        await prisma.user.updateMany({
          where: { clerkId: data.id },
          data: {
            email: primaryEmail,
            firstName: data.first_name || undefined,
            lastName: data.last_name || undefined,
          },
        });
        console.log(`Updated user with Clerk ID ${data.id}`);
      }
    }

    if (type === "user.deleted") {
      // We keep user data for referential integrity
      // Just log the deletion for now
      console.log(`User deleted in Clerk: ${data.id}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: "Failed to process webhook" });
  }
});

export default router;
