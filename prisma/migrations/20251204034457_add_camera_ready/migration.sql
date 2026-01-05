-- CreateTable
CREATE TABLE "CameraReadyFile" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CameraReadyFile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CameraReadyFile" ADD CONSTRAINT "CameraReadyFile_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
