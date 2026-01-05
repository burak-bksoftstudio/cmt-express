import { Router } from "express";
import { proceedingsController } from "./proceedings.controller";
import { verifyClerkAuth } from "../auth/clerk.middleware";
import { requireAdminOrChair } from "../auth/auth.middleware";

const router = Router();

/**
 * GET /proceedings/conferences/:id
 * Get proceedings data for a conference
 * Requires: Access Token
 */
router.get(
  "/conferences/:id",
  verifyClerkAuth,
  requireAdminOrChair,
  proceedingsController.getProceedings
);

/**
 * GET /proceedings/conferences/:id/pdf
 * Download proceedings as PDF/HTML
 * Requires: Access Token
 */
router.get(
  "/conferences/:id/pdf",
  verifyClerkAuth,
  requireAdminOrChair,
  proceedingsController.downloadProceedingsPdf
);

/**
 * GET /proceedings/conferences/:id/bibtex
 * Download full BibTeX file
 * Requires: Access Token
 */
router.get(
  "/conferences/:id/bibtex",
  verifyClerkAuth,
  requireAdminOrChair,
  proceedingsController.downloadBibtex
);

export default router;

