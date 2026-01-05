import { t } from "@/lib/i18n";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { useSimpleToast } from "@/components/ui/toast";
import { formatDateTime, formatDate } from "@/lib/utils";
import {
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileText,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Eye,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface CameraReadyAdminPanelProps {
  paperId: string;
  paperTitle: string;
  originalFileUrl?: string;
  files: CameraReadyFile[];
  loading?: boolean;
  onUpdate: () => void;
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
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  needs_revision: {
    label: "Needs Revision",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
};

function AdminPanelSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-[200px]" />
      </CardContent>
    </Card>
  );
}

export function CameraReadyAdminPanel({
  paperId,
  paperTitle,
  originalFileUrl,
  files,
  loading = false,
  onUpdate,
}: CameraReadyAdminPanelProps) {
  const { addToast, ToastRenderer } = useSimpleToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [revisionComment, setRevisionComment] = useState("");
  const [previewFile, setPreviewFile] = useState<CameraReadyFile | null>(null);

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

  // Get latest pending file
  const latestPendingFile = sortedFiles.find((f) => f.status === "submitted");

  // Handle approve
  const handleApprove = useCallback(
    async (fileId: string) => {
      setActionLoading(fileId);
      try {
        await cameraReadyApi.approve(paperId);
        addToast({
          type: "success",
          title: "Approved",
          description: "Camera-ready version has been approved.",
        });
        onUpdate();
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to approve";
        addToast({
          type: "error",
          title: "Error",
          description: message,
        });
      } finally {
        setActionLoading(null);
      }
    },
    [paperId, onUpdate, addToast]
  );

  // Handle request revision
  const handleRequestRevision = useCallback(async () => {
    if (!selectedFileId || !revisionComment.trim()) return;

    setActionLoading(selectedFileId);
    try {
      await cameraReadyApi.requestRevision(paperId, revisionComment);
      addToast({
        type: "success",
        title: "Revision Requested",
        description: "Author has been notified to submit a revised version.",
      });
      setRevisionDialogOpen(false);
      setRevisionComment("");
      setSelectedFileId(null);
      onUpdate();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to request revision";
      addToast({
        type: "error",
        title: "Error",
        description: message,
      });
    } finally {
      setActionLoading(null);
    }
  }, [paperId, selectedFileId, revisionComment, onUpdate, addToast]);

  // Open revision dialog
  const openRevisionDialog = (fileId: string) => {
    setSelectedFileId(fileId);
    setRevisionDialogOpen(true);
  };

  if (loading) {
    return <AdminPanelSkeleton />;
  }

  return (
    <div className="space-y-6">
      <ToastRenderer />

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera Ready Review
              </CardTitle>
              <CardDescription className="mt-1">
                Review and approve camera-ready submissions for &ldquo;{paperTitle}&rdquo;
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.total} submission(s)</Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onUpdate}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Statistics */}
        {stats.total > 0 && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold">{stats.pending}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
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
          </>
        )}
      </Card>

      {/* Quick Actions for Pending File */}
      {latestPendingFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: appleEasing }}
        >
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Pending Approval
              </CardTitle>
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
                  {/* Compare with Original */}
                  {originalFileUrl && (
                    <a href={originalFileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Original
                      </Button>
                    </a>
                  )}
                  <a href={latestPendingFile.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Camera Ready
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
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Request Revision
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* All Submissions Table */}
      {files.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submission History</CardTitle>
            <CardDescription>
              All camera-ready versions submitted for this paper
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border-t">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Version</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {sortedFiles.map((file, index) => {
                      const status = statusConfig[file.status] || statusConfig.submitted;
                      const version = sortedFiles.length - index;
                      const isLoading = actionLoading === file.id;

                      return (
                        <motion.tr
                          key={file.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="group"
                        >
                          <TableCell>
                            <Badge variant="secondary">v{version}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[200px]">
                                  {file.fileName}
                                </p>
                                {file.reviewerComment && (
                                  <p className="text-xs text-orange-600 flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    Has comments
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={status.className}>
                              {status.icon}
                              <span className="ml-1">{status.label}</span>
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
                              {file.status === "submitted" && (
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
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">No Submissions Yet</h3>
            <p className="mt-2 max-w-sm text-center text-muted-foreground">
              The author has not submitted a camera-ready version for this paper yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-500" />
              Request Revision
            </DialogTitle>
            <DialogDescription>
              Provide feedback explaining what changes are needed.
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
              Be specific about what needs to be changed.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={!revisionComment.trim() || actionLoading !== null}
              className="bg-orange-600 hover:bg-orange-700"
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

