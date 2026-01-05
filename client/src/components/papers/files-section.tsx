import { t } from "@/lib/i18n";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SlideOver } from "@/components/ui/slide-over";
import { PDFViewer } from "./pdf-viewer";
import { VersionBadge, calculateFileVersions } from "./version-badge";
import { UploadFileModal } from "./upload-file-modal";
import { PaperFile } from "@/types";
import { paperApi } from "@/lib/api";
import { formatDateTime, formatDate } from "@/lib/utils";
import {
  FolderOpen,
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  File,
  Download,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  HardDrive,
  Eye,
  Plus,
  FileStack,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface FilesSectionProps {
  files: PaperFile[];
  paperId: string;
  canUpload: boolean;
  canDelete: boolean;
  onFileChanged: () => void;
  loading?: boolean;
}

// Get appropriate icon based on MIME type
const getFileIcon = (mimeType: string) => {
  const type = mimeType.toLowerCase();
  if (type.includes("pdf")) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (type.includes("image")) {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  }
  if (type.includes("word") || type.includes("doc")) {
    return <FileText className="h-5 w-5 text-blue-600" />;
  }
  if (type.includes("zip") || type.includes("tar") || type.includes("rar") || type.includes("7z")) {
    return <FileArchive className="h-5 w-5 text-yellow-600" />;
  }
  if (type.includes("tex") || type.includes("latex")) {
    return <FileCode className="h-5 w-5 text-green-600" />;
  }
  if (type.includes("text") || type.includes("plain")) {
    return <FileText className="h-5 w-5 text-gray-500" />;
  }
  return <File className="h-5 w-5 text-gray-400" />;
};

// Get file type badge color
const getFileTypeBadge = (mimeType: string) => {
  const type = mimeType.toLowerCase();
  const extension = mimeType.split("/").pop()?.toUpperCase() || "FILE";

  if (type.includes("pdf")) {
    return { label: "PDF", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  }
  if (type.includes("image")) {
    return { label: extension, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  }
  if (type.includes("word") || type.includes("doc")) {
    return { label: "DOC", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  }
  if (type.includes("zip") || type.includes("archive")) {
    return { label: "ZIP", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
  }
  if (type.includes("tex")) {
    return { label: "TEX", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
  }
  return { label: extension, className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" };
};

// Check if file is previewable (PDF)
const isPreviewable = (mimeType: string) => {
  return mimeType.toLowerCase().includes("pdf");
};

// Loading skeleton for files table
function FilesTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, ease: appleEasing }}
          className="flex items-center gap-4 p-4 border rounded-xl"
        >
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </motion.div>
      ))}
    </div>
  );
}

// Empty state component
function EmptyState({ canUpload, onUpload }: { canUpload: boolean; onUpload: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: appleEasing }}
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary/10 to-primary/5"
      >
        <FolderOpen className="h-10 w-10 text-primary/60" />
      </motion.div>
      <h3 className="mt-6 text-lg font-semibold">No files uploaded</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {canUpload
          ? "Upload your paper submission to get started. Each upload creates a new version."
          : "No files have been uploaded for this paper yet."}
      </p>
      {canUpload && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button onClick={onUpload} className="mt-6 gap-2">
            <Upload className="h-4 w-4" />
            Upload First Version
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

export function FilesSection({
  files,
  paperId,
  canUpload,
  canDelete,
  onFileChanged,
  loading = false,
}: FilesSectionProps) {
  const [previewFile, setPreviewFile] = useState<PaperFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteFile, setDeleteFile] = useState<PaperFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Calculate version numbers
  const versionMap = calculateFileVersions(files);

  // Sort files by date (newest first for display)
  const sortedFiles = [...files].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get current version count
  const currentVersionCount = files.length;

  // Open preview with presigned URL
  const openPreview = useCallback(async (file: PaperFile) => {
    if (isPreviewable(file.mimeType)) {
      try {
        const response = await paperApi.getDownloadUrl(paperId);
        const downloadUrl = response.data.data.downloadUrl;
        setPreviewUrl(downloadUrl);
        setPreviewFile(file);
      } catch (error) {
        console.error("Failed to get preview URL:", error);
        setDeleteError("Failed to load preview. Please try again.");
        setTimeout(() => setDeleteError(null), 3000);
      }
    }
  }, [paperId]);

  // Close preview
  const closePreview = useCallback(() => {
    setPreviewFile(null);
    setPreviewUrl(null);
  }, []);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteFile) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await paperApi.deleteFile(paperId, deleteFile.id);
      setDeleteSuccess(true);
      onFileChanged();

      // Clear success after delay
      setTimeout(() => {
        setDeleteSuccess(false);
        setDeleteFile(null);
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "Failed to delete file";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  // Handle upload success
  const handleUploadSuccess = useCallback(() => {
    onFileChanged();
  }, [onFileChanged]);

  // Handle download with presigned URL
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      setDownloadingFileId(fileId);
      const response = await paperApi.getDownloadUrl(paperId);
      const downloadUrl = response.data.data.downloadUrl;

      // Open presigned URL in new tab to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      setDeleteError("Failed to download file. Please try again.");
      setTimeout(() => setDeleteError(null), 3000);
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-linear-to-r from-muted/50 to-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileStack className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Paper Files</CardTitle>
                <CardDescription>
                  Manage your submission files and versions
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {files.length} version{files.length !== 1 ? "s" : ""}
              </Badge>
              {canUpload && (
                <Button
                  size="sm"
                  onClick={() => setUploadModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Version</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {/* Delete Error */}
          <AnimatePresence>
            {deleteError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4"
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Success */}
          <AnimatePresence>
            {deleteSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4"
              >
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    File deleted successfully!
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {loading ? (
            <FilesTableSkeleton />
          ) : sortedFiles.length === 0 ? (
            <EmptyState
              canUpload={canUpload}
              onUpload={() => setUploadModalOpen(true)}
            />
          ) : (
            /* Files List */
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {sortedFiles.map((file, index) => {
                  const typeInfo = getFileTypeBadge(file.mimeType);
                  const versionInfo = versionMap.get(file.id);
                  const version = versionInfo?.version || 1;
                  const isLatest = versionInfo?.isLatest || false;
                  const canPreview = isPreviewable(file.mimeType);

                  return (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        duration: 0.3,
                        ease: appleEasing,
                        delay: index * 0.05,
                      }}
                      className={`group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                        isLatest
                          ? "border-green-200 bg-linear-to-r from-green-50/50 to-transparent dark:border-green-800/50 dark:from-green-950/20"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {/* File Icon */}
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                        isLatest ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                      }`}>
                        {getFileIcon(file.mimeType)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-medium truncate max-w-[280px]">
                            {file.fileName}
                          </h4>
                          <VersionBadge
                            version={version}
                            isLatest={isLatest}
                            totalVersions={currentVersionCount}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(file.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {file.mimeType.split("/").pop()?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* File Type Badge */}
                      <Badge
                        variant="outline"
                        className={`shrink-0 hidden sm:flex ${typeInfo.className}`}
                      >
                        {typeInfo.label}
                      </Badge>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Preview Button (PDF only) */}
                        {canPreview && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPreview(file)}
                            className="gap-1.5 transition-all hover:bg-primary hover:text-primary-foreground"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden lg:inline">Preview</span>
                          </Button>
                        )}

                        {/* Download Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.id, file.fileName)}
                          disabled={downloadingFileId === file.id}
                          className="transition-all hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                        >
                          {downloadingFileId === file.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Delete Button (Author/Admin only) */}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteFile(file)}
                            className="transition-all hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Summary Footer */}
          {sortedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 pt-4 border-t"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <FileStack className="h-4 w-4" />
                  {sortedFiles.length} version{sortedFiles.length !== 1 ? "s" : ""} uploaded
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Last upload: {formatDate(sortedFiles[0]?.createdAt)}
                </span>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <UploadFileModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        paperId={paperId}
        onUploadSuccess={handleUploadSuccess}
        currentVersion={currentVersionCount}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteFile !== null} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteFile?.fileName}&rdquo;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Viewer Slide-Over */}
      <SlideOver
        open={previewFile !== null && previewUrl !== null}
        onClose={closePreview}
        title={previewFile?.fileName || "PDF Preview"}
        width="full"
      >
        {previewFile && previewUrl && (
          <PDFViewer
            fileUrl={previewUrl}
            fileName={previewFile.fileName}
          />
        )}
      </SlideOver>
    </>
  );
}
