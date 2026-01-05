import { t } from "@/lib/i18n";

import { useState, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CameraReadyFile } from "@/types";
import { cameraReadyApi } from "@/lib/api";
import { formatDateTime, formatDate } from "@/lib/utils";
import { useSimpleToast } from "@/components/ui/toast";
import {
  Camera,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  File,
  Calendar,
} from "lucide-react";

interface CameraReadyManagerProps {
  paperId: string;
  files: CameraReadyFile[];
  canUpload?: boolean;
  canApprove?: boolean;
  loading?: boolean;
  onUpdate?: () => void;
}

// Status configuration
const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  submitted: {
    label: "Pending Review",
    icon: <Clock className="h-3.5 w-3.5" />,
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  },
  needs_revision: {
    label: "Needs Revision",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  },
};

// Loading skeleton
function ManagerSkeletons() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CameraReadyManager({
  paperId,
  files,
  canUpload = false,
  canApprove = false,
  loading = false,
  onUpdate,
}: CameraReadyManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [revisionComment, setRevisionComment] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast, ToastRenderer } = useSimpleToast();

  // Sort files by upload date (newest first)
  const sortedFiles = [...files].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  // Get statistics
  const stats = {
    total: files.length,
    pending: files.filter((f) => f.status === "submitted").length,
    revision: files.filter((f) => f.status === "needs_revision").length,
    approved: files.filter((f) => f.status === "approved").length,
  };

  // Get the most recent pending file (for approval actions)
  const latestPendingFile = sortedFiles.find((f) => f.status === "submitted");

  const handleUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setUploadError("Only PDF files are allowed");
        addToast({
          type: "error",
          title: "Invalid File Type",
          description: "Please upload a PDF file only.",
        });
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("File size exceeds 50MB limit");
        addToast({
          type: "error",
          title: "File Too Large",
          description: "Maximum file size is 50MB.",
        });
        return;
      }

      setUploading(true);
      setUploadError(null);

      try {
        await cameraReadyApi.upload(paperId, file);
        addToast({
          type: "success",
          title: "Upload Successful",
          description: "Your camera-ready file has been uploaded.",
        });
        onUpdate?.();
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to upload file";
        setUploadError(message);
        addToast({
          type: "error",
          title: "Upload Failed",
          description: message,
        });
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [paperId, onUpdate, addToast]
  );

  const handleApprove = useCallback(
    async (fileId: string) => {
      setActionLoading(fileId);
      try {
        // Backend uses paperId for approval, not fileId
        await cameraReadyApi.approve(paperId);
        addToast({
          type: "success",
          title: "File Approved",
          description: "The camera-ready file has been approved.",
        });
        onUpdate?.();
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to approve file";
        addToast({
          type: "error",
          title: "Approval Failed",
          description: message,
        });
      } finally {
        setActionLoading(null);
      }
    },
    [paperId, onUpdate, addToast]
  );

  const handleRequestRevision = useCallback(async () => {
    if (!selectedFileId || !revisionComment.trim()) return;

    setActionLoading(selectedFileId);
    try {
      // Backend uses paperId for rejection, not fileId
      await cameraReadyApi.requestRevision(paperId, revisionComment);
      addToast({
        type: "success",
        title: "Revision Requested",
        description: "The author has been notified to submit a revised version.",
      });
      setRevisionDialogOpen(false);
      setRevisionComment("");
      setSelectedFileId(null);
      onUpdate?.();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to request revision";
      addToast({
        type: "error",
        title: "Request Failed",
        description: message,
      });
    } finally {
      setActionLoading(null);
    }
  }, [paperId, selectedFileId, revisionComment, onUpdate, addToast]);

  const openRevisionDialog = (fileId: string) => {
    setSelectedFileId(fileId);
    setRevisionDialogOpen(true);
  };

  // Loading state
  if (loading) {
    return <ManagerSkeletons />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Renderer */}
      <ToastRenderer />

      {/* Upload Section (Authors only) */}
      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Camera Ready
            </CardTitle>
            <CardDescription>
              Upload the final camera-ready version of your paper
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              className="hidden"
              accept=".pdf,application/pdf"
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Select PDF File
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <File className="h-4 w-4" />
                <span>PDF only, max 50MB</span>
              </div>
            </div>

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics (Admin/Chair) */}
      {canApprove && files.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Submission Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revision</p>
                  <p className="text-xl font-bold">{stats.revision}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approved</p>
                  <p className="text-xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Panel (Admin/Chair - Latest Pending File) */}
      {canApprove && latestPendingFile && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Pending Approval
            </CardTitle>
            <CardDescription>
              Review and approve or request revision for the latest submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{latestPendingFile.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded {formatDateTime(latestPendingFile.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href={latestPendingFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </a>
                <Button
                  size="sm"
                  onClick={() => handleApprove(latestPendingFile.id)}
                  disabled={actionLoading === latestPendingFile.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === latestPendingFile.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openRevisionDialog(latestPendingFile.id)}
                  disabled={actionLoading === latestPendingFile.id}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Request Revision
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Table */}
      {files.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">No camera-ready files</h3>
            <p className="mt-2 max-w-sm text-center text-muted-foreground">
              {canUpload
                ? "Upload your camera-ready version to proceed with publication."
                : "No camera-ready files have been submitted yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Submission History</CardTitle>
                <CardDescription>
                  All camera-ready submissions for this paper
                </CardDescription>
              </div>
              <Badge variant="secondary">{files.length} file(s)</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border-t">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-medium">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        File
                      </span>
                    </TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Uploaded
                      </span>
                    </TableHead>
                    <TableHead className="font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFiles.map((file) => {
                    const status = statusConfig[file.status] || statusConfig.submitted;
                    const isLoading = actionLoading === file.id;

                    return (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[200px]">
                                {file.fileName}
                              </p>
                              {file.reviewerComment && (
                                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                                  <MessageSquare className="h-3 w-3" />
                                  Has revision comments
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.className}>
                            <span className="flex items-center gap-1.5">
                              {status.icon}
                              {status.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(file.uploadedAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                            {canApprove && file.status === "submitted" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(file.id)}
                                  disabled={isLoading}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRevisionDialog(file.id)}
                                  disabled={isLoading}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revision Comment Detail (shown for files with comments) */}
      {sortedFiles
        .filter((f) => f.reviewerComment)
        .slice(0, 1)
        .map((file) => (
          <Card key={file.id} className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <MessageSquare className="h-4 w-4" />
                Revision Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-white dark:bg-gray-900 p-4 border">
                <p className="text-sm">{file.reviewerComment}</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Please address these comments and upload a revised version.
              </p>
            </CardContent>
          </Card>
        ))}

      {/* Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-500" />
              Request Revision
            </DialogTitle>
            <DialogDescription>
              Provide feedback explaining what changes are needed. The author will be
              notified and can submit a revised version.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              placeholder="Describe what changes are required..."
              rows={5}
              className="resize-none"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Be specific about what needs to be changed for the submission to be approved.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setRevisionDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={!revisionComment.trim() || actionLoading !== null}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Request Revision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
