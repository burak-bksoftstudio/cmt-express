
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CameraReadyStatusCard, CameraReadyStatus } from "./camera-ready-status";
import { CameraReadyUpload } from "./camera-ready-upload";
import { CameraReadyAdminPanel } from "./camera-ready-admin-panel";
import { cameraReadyApi } from "@/lib/api";
import { CameraReadyFile } from "@/types";
import {
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface CameraReadyPanelProps {
  paperId: string;
  paperTitle: string;
  paperStatus: string;
  originalFileUrl?: string;
  isAuthor: boolean;
  canApprove: boolean;
  onUpdate?: () => void;
}

function PanelSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 rounded-lg" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function CameraReadyPanel({
  paperId,
  paperTitle,
  paperStatus,
  originalFileUrl,
  isAuthor,
  canApprove,
  onUpdate,
}: CameraReadyPanelProps) {
  const [files, setFiles] = useState<CameraReadyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch camera-ready files
  const fetchFiles = useCallback(async () => {
    try {
      const response = await cameraReadyApi.getByPaper(paperId);
      setFiles(response.data?.data || []);
      setError(null);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || "Failed to load camera-ready files");
      }
      setFiles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paperId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  const handleUpdate = () => {
    fetchFiles();
    onUpdate?.();
  };

  // Get current status
  const getCurrentStatus = (): CameraReadyStatus => {
    if (files.length === 0) return "pending";
    const approvedFile = files.find((f) => f.status === "approved");
    if (approvedFile) return "approved";
    const revisionFile = files.find((f) => f.status === "needs_revision");
    if (revisionFile) return "needs_revision";
    const submittedFile = files.find((f) => f.status === "submitted");
    if (submittedFile) return "submitted";
    return "pending";
  };

  // Get latest file
  const getLatestFile = () => {
    if (files.length === 0) return null;
    return [...files].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];
  };

  const currentStatus = getCurrentStatus();
  const latestFile = getLatestFile();
  const canUpload =
    isAuthor &&
    (paperStatus === "accepted" ||
      paperStatus === "camera_ready_needs_revision" ||
      currentStatus === "needs_revision");

  // Paper not accepted - show informative message
  if (paperStatus !== "accepted" && paperStatus !== "camera_ready_needs_revision" && files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Camera Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <XCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">Not Available</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Camera-ready upload is only available after your paper has been accepted.
                Current status: <strong>{paperStatus.replace(/_/g, " ")}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Loading state
  if (loading) {
    return <PanelSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing }}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  // Admin/Chair view
  if (canApprove) {
    return (
      <CameraReadyAdminPanel
        paperId={paperId}
        paperTitle={paperTitle}
        originalFileUrl={originalFileUrl}
        files={files}
        loading={refreshing}
        onUpdate={handleUpdate}
      />
    );
  }

  // Author view
  return (
    <div className="space-y-6">
      {/* Status Card */}
      <CameraReadyStatusCard
        status={currentStatus}
        fileName={latestFile?.fileName}
        uploadedAt={latestFile?.uploadedAt}
        reviewerComment={latestFile?.reviewerComment}
        versionNumber={files.length}
      />

      {/* Upload Section (for authors who can upload) */}
      {canUpload && (
        <CameraReadyUpload
          paperId={paperId}
          onSuccess={handleUpdate}
          disabled={currentStatus === "submitted" || currentStatus === "approved"}
        />
      )}

      {/* Submission History */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Submission History</CardTitle>
                  <CardDescription>
                    All camera-ready versions you have submitted
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {[...files]
                    .sort(
                      (a, b) =>
                        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                    )
                    .map((file, index) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="shrink-0">
                            v{files.length - index}
                          </Badge>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            file.status === "approved"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : file.status === "needs_revision"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }
                        >
                          {file.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {file.status === "needs_revision" && (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {file.status === "submitted" && <Clock className="h-3 w-3 mr-1" />}
                          {file.status === "approved"
                            ? "Approved"
                            : file.status === "needs_revision"
                            ? "Revision"
                            : "Pending"}
                        </Badge>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

