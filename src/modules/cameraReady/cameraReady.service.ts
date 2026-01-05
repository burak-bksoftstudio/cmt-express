import { prisma } from "../../config/prisma";
import { s3Service } from "../s3/s3.service";

export const cameraReadyService = {
  /**
   * Upload camera-ready file for an accepted paper
   * Authors or conference chairs can upload
   * Paper must have status = "accepted"
   */
  async uploadCameraReady(
    paperId: string,
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string }
  ) {
    // Check paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        authors: {
          select: { userId: true },
        },
        conference: {
          select: { id: true },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // Check if user is an author of this paper
    const isAuthor = paper.authors.some((author) => author.userId === userId);

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    // Check if user is a conference chair
    const chairMembership = await prisma.conferenceMember.findFirst({
      where: {
        conferenceId: paper.conference.id,
        userId,
        role: "CHAIR",
      },
    });
    const isChair = !!chairMembership;

    if (!isAuthor && !isChair && !user?.isAdmin) {
      throw new Error("Only authors or conference chairs can upload camera-ready files");
    }

    // Check paper status is "accepted"
    if (paper.status !== "accepted") {
      throw new Error("Camera-ready can only be uploaded for accepted papers");
    }

    // Upload to S3 under camera-ready folder
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
      throw new Error("AWS_S3_BUCKET is not defined");
    }

    const key = `camera-ready/${Date.now()}-${file.originalname}`;

    const { PutObjectCommand, S3Client } = await import("@aws-sdk/client-s3");

    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    const fileUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Create CameraReadyFile record and update paper status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create camera ready file record
      const cameraReadyFile = await tx.cameraReadyFile.create({
        data: {
          paperId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileKey: key,
          fileUrl,
        },
      });

      // Update paper status
      await tx.paper.update({
        where: { id: paperId },
        data: {
          status: "camera_ready_submitted",
        },
      });

      return cameraReadyFile;
    });

    return result;
  },

  /**
   * Get camera-ready files for a paper
   * SECURITY: Validates conference membership before allowing access
   */
  async getCameraReadyFiles(paperId: string, userId?: string) {
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        conference: {
          select: { id: true },
        },
      },
    });

    if (!paper) {
      throw new Error("Paper not found");
    }

    // SECURITY: Verify user has access to this conference
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        const membership = await prisma.conferenceMember.findFirst({
          where: {
            conferenceId: paper.conferenceId,
            userId,
          },
        });

        const isAuthorOfPaper = await prisma.paperAuthor.findFirst({
          where: {
            paperId,
            userId,
          },
        });

        if (!membership && !isAuthorOfPaper) {
          throw new Error("You do not have access to this conference");
        }
      }
    }

    const files = await prisma.cameraReadyFile.findMany({
      where: { paperId },
      orderBy: { uploadedAt: "desc" },
    });

    return files;
  },
};

