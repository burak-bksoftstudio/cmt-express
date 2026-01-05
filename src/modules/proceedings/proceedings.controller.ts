import { Request, Response } from "express";
import { proceedingsService } from "./proceedings.service";

export const proceedingsController = {
  /**
   * GET /conferences/:id/proceedings
   * Get proceedings data for a conference
   */
  async getProceedings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Conference ID is required",
        });
        return;
      }

      const data = await proceedingsService.getProceedings(id);

      res.status(200).json({
        success: true,
        message: "Proceedings fetched successfully",
        data,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch proceedings";
      const status = message === "Conference not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conferences/:id/proceedings/pdf
   * Generate and download proceedings PDF
   */
  async downloadProceedingsPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Conference ID is required",
        });
        return;
      }

      const htmlContent = await proceedingsService.generateProceedingsPdfHtml(id);

      // For now, return HTML that can be printed to PDF
      // In production, you'd use a library like puppeteer or pdfkit to generate actual PDF
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="proceedings-${id}.html"`
      );
      res.status(200).send(htmlContent);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate PDF";
      const status = message === "Conference not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },

  /**
   * GET /conferences/:id/proceedings/bibtex
   * Download full BibTeX file
   */
  async downloadBibtex(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "Conference ID is required",
        });
        return;
      }

      const data = await proceedingsService.getProceedings(id);

      res.setHeader("Content-Type", "application/x-bibtex; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${data.conference.shortName || "proceedings"}-${data.conference.year}.bib"`
      );
      res.status(200).send(data.fullBibtex);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate BibTeX";
      const status = message === "Conference not found" ? 404 : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  },
};

