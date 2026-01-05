import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

// Import Clerk middleware
import { clerkMiddleware } from "./modules/auth/clerk.middleware";

// Import routes
import authRoutes from "./modules/auth/auth.routes";
import adminAuthRoutes from "./modules/auth/admin-auth.routes";
import webhookRoutes from "./modules/auth/webhook.routes";
import conferenceRequestRoutes from "./modules/conferenceRequest/conferenceRequest.routes";
import conferenceRoutes from "./modules/conference/conference.routes";
import conferenceMembersRoutes from "./modules/conference-members/conference-members.routes";
import paperRoutes from "./modules/paper/paper.routes";
import reviewRoutes from "./modules/review/review.routes";
import decisionRoutes from "./modules/decision/decision.routes";
import cameraReadyRoutes from "./modules/cameraReady/cameraReady.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import cameraReadyApprovalRoutes from "./modules/cameraReadyApproval/cameraReadyApproval.routes";
import reviewerConflictRoutes from "./modules/reviewerConflict/reviewerConflict.routes";
import reviewBiddingRoutes from "./modules/review-bidding/bidding.routes";
import reviewAssignmentRoutes from "./modules/review-assignment/assignment.routes";
import proceedingsRoutes from "./modules/proceedings/proceedings.routes";
import invitationRoutes from "./modules/invitation/invitation.routes";
import metareviewRoutes from "./modules/metareview/metareview.routes";
import discussionRoutes from "./modules/discussion/discussion.routes";
import paperVersionRoutes from "./modules/paper-version/paper-version.routes";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook routes need raw body for signature verification - must come before express.json()
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);

// Middleware - CORS with credentials for Clerk auth
const allowedOrigins = process.env.NODE_ENV === "production"
  ? ["https://cmt.bksoftstudio.com"]
  : [
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:3004",
      "http://localhost:3005",
      "http://localhost:3006",
      "http://localhost:3007",
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply Clerk middleware globally
app.use(clerkMiddleware());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Routes - All prefixed with /api
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminAuthRoutes); // Admin auth bypass (no Clerk)
app.use("/api/conference-requests", conferenceRequestRoutes);
app.use("/api/conferences", conferenceRoutes);
app.use("/api/conferences/:id/members", conferenceMembersRoutes);
app.use("/api/papers", paperRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/decisions", decisionRoutes);
app.use("/api/camera-ready", cameraReadyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/camera-ready-approval", cameraReadyApprovalRoutes);
app.use("/api/conflicts", reviewerConflictRoutes);
// New Review Bidding & Assignment APIs
app.use("/api/review-bids", reviewBiddingRoutes);
app.use("/api/assignments", reviewAssignmentRoutes);

// Invitation API
app.use("/api/invitations", invitationRoutes);

// Proceedings API
app.use("/api/proceedings", proceedingsRoutes);

// Metareview API
app.use("/api/metareviews", metareviewRoutes);

// Discussion API
app.use("/api/discussions", discussionRoutes);

// Paper Version API
app.use("/api", paperVersionRoutes);

// Admin API (reviews, conferences, stats)
app.use("/api/admin", adminRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "../client/dist");

  // Serve static files
  app.use(express.static(clientDistPath));

  // Handle React routing - serve index.html for all non-API routes
  app.get("/{*path}", (req: Request, res: Response) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV === "production") {
    console.log("📦 Serving React app from client/dist");
  }
});
