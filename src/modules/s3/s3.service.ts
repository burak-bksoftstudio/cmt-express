import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const s3Service = {
  /**
   * Upload a file buffer to S3
   */
  async uploadFile(buffer: Buffer, fileName: string, mimeType: string) {
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
      throw new Error("AWS_S3_BUCKET is not defined");
    }

    const key = `papers/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3.send(command);

    const fileUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { key, url: fileUrl };
  },

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string) {
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
      throw new Error("AWS_S3_BUCKET is not defined");
    }

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3.send(command);

    return true;
  },

  /**
   * Optional: Generate a presigned URL for uploading
   */
  async getPresignedUrl(key: string) {
    const bucket = process.env.AWS_S3_BUCKET;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(s3, command, { expiresIn: 3600 });
  },

  /**
   * Generate a presigned URL for downloading a file from S3
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 300 = 5 minutes)
   */
  async getDownloadPresignedUrl(key: string, expiresIn: number = 300) {
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
      throw new Error("AWS_S3_BUCKET is not defined");
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(s3, command, { expiresIn });
  },
};
