import { prisma } from "../../config/prisma";

export class PaperVersionService {
  /**
   * Create a new version snapshot
   */
  async createVersion(data: {
    paperId: string;
    versionType: "SUBMISSION" | "REVISION" | "CAMERA_READY";
    title: string;
    abstract?: string;
    fileUrl: string;
    fileKey: string;
    fileName: string;
    createdBy?: string;
    notes?: string;
  }) {
    // Get the next version number
    const latestVersion = await prisma.paperVersion.findFirst({
      where: { paperId: data.paperId },
      orderBy: { version: "desc" },
    });

    const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

    return await prisma.paperVersion.create({
      data: {
        paperId: data.paperId,
        version: nextVersion,
        versionType: data.versionType,
        title: data.title,
        abstract: data.abstract,
        fileUrl: data.fileUrl,
        fileKey: data.fileKey,
        fileName: data.fileName,
        createdBy: data.createdBy,
        notes: data.notes,
      },
    });
  }

  /**
   * Get all versions for a paper
   */
  async getVersions(paperId: string) {
    return await prisma.paperVersion.findMany({
      where: { paperId },
      orderBy: { version: "desc" },
    });
  }

  /**
   * Get a specific version
   */
  async getVersion(paperId: string, version: number) {
    return await prisma.paperVersion.findUnique({
      where: {
        paperId_version: {
          paperId,
          version,
        },
      },
    });
  }

  /**
   * Get the latest version
   */
  async getLatestVersion(paperId: string) {
    return await prisma.paperVersion.findFirst({
      where: { paperId },
      orderBy: { version: "desc" },
    });
  }

  /**
   * Get the version active at a specific date (for assignment snapshots)
   */
  async getVersionAtDate(paperId: string, date: Date) {
    return await prisma.paperVersion.findFirst({
      where: {
        paperId,
        createdAt: {
          lte: date,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const paperVersionService = new PaperVersionService();
