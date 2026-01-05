import { prisma } from "../../config/prisma";

interface PaperAuthor {
  firstName: string;
  lastName: string;
  email: string;
  order: number;
}

interface AcceptedPaper {
  id: string;
  title: string;
  abstract: string | null;
  authors: string[];
  authorDetails: PaperAuthor[];
  track: string | null;
  finalPdfUrl: string | null;
  keywords: string[];
  bibtex: string;
}

interface ProceedingsData {
  conference: {
    id: string;
    name: string;
    shortName: string | null;
    year: number;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  generatedAt: string;
  acceptedPapers: AcceptedPaper[];
  fullBibtex: string;
  statistics: {
    totalAccepted: number;
    byTrack: { track: string; count: number }[];
  };
}

/**
 * Generate BibTeX entry for a paper
 */
function generateBibtex(
  paper: {
    id: string;
    title: string;
    authors: string[];
    keywords: string[];
  },
  conferenceName: string,
  year: number
): string {
  // Create a clean citation key from paper ID
  const citationKey = paper.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);

  // Format authors for BibTeX (Last, First and Last, First format)
  const authorString = paper.authors.join(" and ");

  // Format keywords
  const keywordsString = paper.keywords.join(", ");

  // Escape special LaTeX characters in title
  const escapedTitle = paper.title
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/#/g, "\\#")
    .replace(/\$/g, "\\$");

  const bibtex = `@inproceedings{${citationKey},
  title = {${escapedTitle}},
  author = {${authorString}},
  booktitle = {${conferenceName}},
  year = {${year}},
  keywords = {${keywordsString}}
}`;

  return bibtex;
}

/**
 * Generate PDF content for proceedings (returns HTML for PDF generation)
 */
function generateProceedingsHtml(data: ProceedingsData): string {
  const papersHtml = data.acceptedPapers
    .map(
      (paper, index) => `
    <div class="paper" style="page-break-inside: avoid; margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937;">${index + 1}. ${paper.title}</h3>
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;"><strong>Authors:</strong> ${paper.authors.join(", ")}</p>
      ${paper.track ? `<p style="margin: 0 0 8px 0; font-size: 11px; color: #9ca3af;"><strong>Track:</strong> ${paper.track}</p>` : ""}
      ${paper.abstract ? `<p style="margin: 8px 0 0 0; font-size: 11px; color: #4b5563; text-align: justify;">${paper.abstract.slice(0, 500)}${paper.abstract.length > 500 ? "..." : ""}</p>` : ""}
    </div>
  `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.conference.name} - Proceedings</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
      @bottom-center {
        content: counter(page);
      }
    }
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.5;
      color: #1f2937;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 2px solid #3b82f6;
    }
    .header h1 {
      font-size: 24px;
      margin: 0 0 8px 0;
      color: #1e40af;
    }
    .header p {
      font-size: 14px;
      color: #6b7280;
      margin: 4px 0;
    }
    .stats {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .stats h2 {
      font-size: 16px;
      margin: 0 0 12px 0;
    }
    .stats-grid {
      display: flex;
      gap: 24px;
    }
    .stat-item {
      font-size: 12px;
    }
    .papers-section h2 {
      font-size: 18px;
      margin: 24px 0 16px 0;
      color: #1e40af;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.conference.name}</h1>
    ${data.conference.shortName ? `<p><strong>${data.conference.shortName}</strong></p>` : ""}
    ${data.conference.location ? `<p>${data.conference.location}</p>` : ""}
    ${
      data.conference.startDate && data.conference.endDate
        ? `<p>${new Date(data.conference.startDate).toLocaleDateString()} - ${new Date(data.conference.endDate).toLocaleDateString()}</p>`
        : ""
    }
    <p style="font-size: 12px; margin-top: 12px;">Conference Proceedings</p>
  </div>

  <div class="stats">
    <h2>Statistics</h2>
    <div class="stats-grid">
      <div class="stat-item"><strong>Total Accepted Papers:</strong> ${data.statistics.totalAccepted}</div>
    </div>
    ${
      data.statistics.byTrack.length > 0
        ? `
    <div style="margin-top: 12px;">
      <strong style="font-size: 12px;">Papers by Track:</strong>
      <ul style="margin: 4px 0 0 0; padding-left: 20px; font-size: 11px;">
        ${data.statistics.byTrack.map((t) => `<li>${t.track}: ${t.count}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }
  </div>

  <div class="papers-section">
    <h2>Accepted Papers</h2>
    ${papersHtml}
  </div>

  <div class="footer">
    <p>Generated on ${new Date(data.generatedAt).toLocaleString()}</p>
    <p>${data.conference.name} © ${data.conference.year}</p>
  </div>
</body>
</html>
`;

  return html;
}

export const proceedingsService = {
  /**
   * Get proceedings data for a conference
   */
  async getProceedings(conferenceId: string): Promise<ProceedingsData> {
    // Fetch conference
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
      },
    });

    if (!conference) {
      throw new Error("Conference not found");
    }

    // Extract year from conference dates or default to current year
    const year = conference.startDate
      ? new Date(conference.startDate).getFullYear()
      : new Date().getFullYear();

    // Generate shortName from conference name (first letters of words)
    const shortName = conference.name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase())
      .join("")
      .slice(0, 5);

    // Fetch accepted papers with camera-ready files
    const acceptedPapers = await prisma.paper.findMany({
      where: {
        conferenceId,
        decision: {
          OR: [
            { finalDecision: "accept" },
            { finalDecision: "accepted" },
            { decision: "accept" },
            { decision: "accepted" },
          ],
        },
      },
      include: {
        authors: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        track: {
          select: {
            name: true,
          },
        },
        keywords: {
          include: {
            keyword: true,
          },
        },
        cameraReadyFiles: {
          where: {
            status: "approved",
          },
          orderBy: { uploadedAt: "desc" },
          take: 1,
        },
        files: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        decision: true,
      },
      orderBy: [{ track: { name: "asc" } }, { title: "asc" }],
    });

    // Transform papers to proceedings format
    const papers: AcceptedPaper[] = acceptedPapers.map((paper) => {
      // Get authors in order
      const authorDetails: PaperAuthor[] = paper.authors.map((a) => ({
        firstName: a.user?.firstName || "Unknown",
        lastName: a.user?.lastName || "",
        email: a.user?.email || "",
        order: a.order,
      }));

      const authorNames = authorDetails.map((a) => `${a.firstName} ${a.lastName}`);

      // Get keywords
      const keywords = paper.keywords.map((k) => k.keyword?.name || "").filter(Boolean);

      // Get final PDF URL (camera-ready if available, otherwise latest submission)
      const finalPdfUrl =
        paper.cameraReadyFiles[0]?.fileUrl || paper.files[0]?.fileUrl || null;

      // Generate BibTeX
      const bibtex = generateBibtex(
        {
          id: paper.id,
          title: paper.title,
          authors: authorNames,
          keywords,
        },
        conference.name,
        year
      );

      return {
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        authors: authorNames,
        authorDetails,
        track: paper.track?.name || null,
        finalPdfUrl,
        keywords,
        bibtex,
      };
    });

    // Calculate statistics
    const trackCounts = new Map<string, number>();
    papers.forEach((p) => {
      const track = p.track || "General";
      trackCounts.set(track, (trackCounts.get(track) || 0) + 1);
    });

    const statistics = {
      totalAccepted: papers.length,
      byTrack: Array.from(trackCounts.entries())
        .map(([track, count]) => ({ track, count }))
        .sort((a, b) => b.count - a.count),
    };

    // Generate full BibTeX
    const fullBibtex = papers.map((p) => p.bibtex).join("\n\n");

    return {
      conference: {
        id: conference.id,
        name: conference.name,
        shortName,
        year,
        location: conference.location,
        startDate: conference.startDate?.toISOString() || null,
        endDate: conference.endDate?.toISOString() || null,
      },
      generatedAt: new Date().toISOString(),
      acceptedPapers: papers,
      fullBibtex,
      statistics,
    };
  },

  /**
   * Generate proceedings PDF HTML content
   */
  async generateProceedingsPdfHtml(conferenceId: string): Promise<string> {
    const data = await this.getProceedings(conferenceId);
    return generateProceedingsHtml(data);
  },
};
