
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CameraReadyManager } from "./camera-ready-manager";
import { CameraReadyFile } from "@/types";
import {
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
} from "lucide-react";

interface CameraReadySectionProps {
  paperId: string;
  paperStatus: string;
  files: CameraReadyFile[];
  canUpload: boolean;
  canApprove: boolean;
  loading?: boolean;
  onUpdate: () => void;
}

// Loading skeleton
function CameraReadySkeletons() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 rounded-lg" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
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

export function CameraReadySection({
  paperId,
  paperStatus,
  files,
  canUpload,
  canApprove,
  loading = false,
  onUpdate,
}: CameraReadySectionProps) {
  // Calculate status info
  const statusInfo = useMemo(() => {
    const approvedFile = files.find((f) => f.status === "approved");
    const pendingFiles = files.filter((f) => f.status === "submitted");
    const revisionFiles = files.filter((f) => f.status === "needs_revision");

    return { approvedFile, pendingFiles, revisionFiles };
  }, [files]);

  // Determine if author can upload (accepted or needs revision status)
  const canAuthorUpload = useMemo(() => {
    if (!canUpload) return false;
    // Can upload if paper is accepted or needs revision
    const allowedStatuses = ["accepted", "camera_ready_needs_revision"];
    return allowedStatuses.includes(paperStatus);
  }, [canUpload, paperStatus]);

  // Get status summary for the header card
  const getStatusSummary = () => {
    if (statusInfo.approvedFile) {
      return {
        icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
        title: "Camera Ready Approved",
        description: "The final version has been approved and is ready for publication.",
        variant: "success" as const,
        badge: { label: "Approved", className: "bg-green-100 text-green-700" },
      };
    }
    if (statusInfo.revisionFiles.length > 0 && statusInfo.pendingFiles.length === 0) {
      return {
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
        title: "Revision Required",
        description: "Please address the reviewer comments and upload a revised version.",
        variant: "warning" as const,
        badge: { label: "Needs Revision", className: "bg-yellow-100 text-yellow-700" },
      };
    }
    if (statusInfo.pendingFiles.length > 0) {
      return {
        icon: <Clock className="h-6 w-6 text-blue-500" />,
        title: "Pending Review",
        description: "Your camera-ready submission is being reviewed by the committee.",
        variant: "pending" as const,
        badge: { label: "In Review", className: "bg-blue-100 text-blue-700" },
      };
    }
    if (paperStatus === "accepted" || paperStatus === "camera_ready_needs_revision") {
      return {
        icon: <Upload className="h-6 w-6 text-primary" />,
        title: "Upload Required",
        description: "Please upload your camera-ready version for publication.",
        variant: "empty" as const,
        badge: { label: "Awaiting Upload", className: "bg-gray-100 text-gray-700" },
      };
    }
    return null;
  };

  const statusSummary = getStatusSummary();

  // Loading state
  if (loading) {
    return <CameraReadySkeletons />;
  }

  // Paper not accepted - show informative message
  if (paperStatus !== "accepted" && paperStatus !== "camera_ready_needs_revision" && files.length === 0) {
    return (
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
            <h3 className="mt-6 text-lg font-semibold">Camera Ready Not Available</h3>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Camera-ready upload is only available after your paper has been accepted.
              The current paper status is: <strong>{paperStatus.replace(/_/g, " ")}</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera Ready Submission
              </CardTitle>
              <CardDescription>
                {canApprove
                  ? "Review and manage camera-ready submissions"
                  : "Upload and track your camera-ready submission"}
              </CardDescription>
            </div>
            {statusSummary && (
              <Badge className={statusSummary.badge.className}>
                {statusSummary.badge.label}
              </Badge>
            )}
          </div>
        </CardHeader>

        {/* Status Summary */}
        {statusSummary && (
          <CardContent className="pt-0">
            <div
              className={`rounded-lg p-4 flex items-start gap-4 ${
                statusSummary.variant === "success"
                  ? "bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : statusSummary.variant === "warning"
                  ? "bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
                  : statusSummary.variant === "pending"
                  ? "bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                  : "bg-muted border"
              }`}
            >
              {statusSummary.icon}
              <div>
                <p className="font-medium">{statusSummary.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusSummary.description}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Timeline / Progress Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Submission Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {/* Step 1: Upload */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  files.length > 0
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Upload className="h-5 w-5" />
              </div>
              <span className="mt-2 text-xs font-medium">Upload</span>
            </div>

            {/* Connector */}
            <div
              className={`flex-1 h-1 mx-2 rounded ${
                files.length > 0 ? "bg-green-200 dark:bg-green-800" : "bg-muted"
              }`}
            />

            {/* Step 2: Review */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  statusInfo.pendingFiles.length > 0
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : statusInfo.approvedFile || statusInfo.revisionFiles.length > 0
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <FileText className="h-5 w-5" />
              </div>
              <span className="mt-2 text-xs font-medium">Review</span>
            </div>

            {/* Connector */}
            <div
              className={`flex-1 h-1 mx-2 rounded ${
                statusInfo.approvedFile
                  ? "bg-green-200 dark:bg-green-800"
                  : statusInfo.revisionFiles.length > 0
                  ? "bg-yellow-200 dark:bg-yellow-800"
                  : "bg-muted"
              }`}
            />

            {/* Step 3: Decision */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  statusInfo.approvedFile
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    : statusInfo.revisionFiles.length > 0
                    ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {statusInfo.approvedFile ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : statusInfo.revisionFiles.length > 0 ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              <span className="mt-2 text-xs font-medium">
                {statusInfo.approvedFile
                  ? "Approved"
                  : statusInfo.revisionFiles.length > 0
                  ? "Revision"
                  : "Decision"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera Ready Manager */}
      <CameraReadyManager
        paperId={paperId}
        files={files}
        canUpload={canAuthorUpload}
        canApprove={canApprove}
        onUpdate={onUpdate}
      />
    </div>
  );
}
