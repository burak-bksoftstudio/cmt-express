import { Router } from "express";
import { paperVersionController } from "./paper-version.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";

const router = Router();

// All routes require authentication
router.use(verifyClerkAuth);

// Get all versions for a paper
router.get("/papers/:paperId/versions", paperVersionController.getVersions.bind(paperVersionController));

// Get latest version (must come before /:version to avoid conflict)
router.get("/papers/:paperId/versions/latest", paperVersionController.getLatestVersion.bind(paperVersionController));

// Get specific version
router.get("/papers/:paperId/versions/:version", paperVersionController.getVersion.bind(paperVersionController));

export default router;
