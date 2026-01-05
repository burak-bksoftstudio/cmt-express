
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Upload,
  FileText,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

export type CameraReadyStatus = "pending" | "submitted" | "approved" | "needs_revision";

interface CameraReadyStatusProps {
  status: CameraReadyStatus;
  fileName?: string;
  uploadedAt?: string;
  reviewerComment?: string;
  versionNumber?: number;
}

const statusConfig: Record<
  CameraReadyStatus,
  {
    label: string;
    description: string;
    icon: React.ReactNode;
    className: string;
    bgClassName: string;
    progress: number;
  }
> = {
  pending: {
    label: "Awaiting Upload",
    description: "Please upload your camera-ready version",
    icon: <Upload className="h-6 w-6" />,
    className: "text-gray-600 dark:text-gray-400",
    bgClassName: "bg-gray-100 dark:bg-gray-800",
    progress: 0,
  },
  submitted: {
    label: "Under Review",
    description: "Your submission is being reviewed",
    icon: <Clock className="h-6 w-6" />,
    className: "text-blue-600 dark:text-blue-400",
    bgClassName: "bg-blue-100 dark:bg-blue-900/30",
    progress: 50,
  },
  approved: {
    label: "Approved",
    description: "Your camera-ready version has been approved",
    icon: <CheckCircle2 className="h-6 w-6" />,
    className: "text-green-600 dark:text-green-400",
    bgClassName: "bg-green-100 dark:bg-green-900/30",
    progress: 100,
  },
  needs_revision: {
    label: "Revision Required",
    description: "Please address the comments and resubmit",
    icon: <AlertTriangle className="h-6 w-6" />,
    className: "text-yellow-600 dark:text-yellow-400",
    bgClassName: "bg-yellow-100 dark:bg-yellow-900/30",
    progress: 25,
  },
};

export function CameraReadyStatusCard({
  status,
  fileName,
  uploadedAt,
  reviewerComment,
  versionNumber = 1,
}: CameraReadyStatusProps) {
  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: appleEasing }}
    >
      <Card
        className={`border-2 ${
          status === "approved"
            ? "border-green-200 dark:border-green-800"
            : status === "needs_revision"
            ? "border-yellow-200 dark:border-yellow-800"
            : status === "submitted"
            ? "border-blue-200 dark:border-blue-800"
            : "border-muted"
        }`}
      >
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${config.bgClassName}`}
              >
                <span className={config.className}>{config.icon}</span>
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Camera Ready Status
                  {versionNumber > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      v{versionNumber}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`${config.className} border-current px-3 py-1`}
            >
              {config.icon}
              <span className="ml-2">{config.label}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{config.progress}%</span>
            </div>
            <Progress
              value={config.progress}
              className={`h-2 ${
                status === "approved"
                  ? "[&>div]:bg-green-500"
                  : status === "needs_revision"
                  ? "[&>div]:bg-yellow-500"
                  : status === "submitted"
                  ? "[&>div]:bg-blue-500"
                  : ""
              }`}
            />
          </div>

          {/* File Info */}
          {fileName && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{fileName}</p>
                {uploadedAt && (
                  <p className="text-xs text-muted-foreground">
                    Uploaded {new Date(uploadedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Revision Comment */}
          {status === "needs_revision" && reviewerComment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/20"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Revision Required
                  </p>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap">
                    {reviewerComment}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Timeline Steps */}
          <div className="flex items-center justify-between pt-2">
            {/* Step 1: Upload */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  status !== "pending"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Upload className="h-4 w-4" />
              </div>
              <span className="mt-1 text-xs">Upload</span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-2 ${
                status !== "pending" ? "bg-green-200 dark:bg-green-800" : "bg-muted"
              }`}
            />

            {/* Step 2: Review */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  status === "submitted"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                    : status === "approved" || status === "needs_revision"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <span className="mt-1 text-xs">Review</span>
            </div>

            <div
              className={`flex-1 h-0.5 mx-2 ${
                status === "approved"
                  ? "bg-green-200 dark:bg-green-800"
                  : status === "needs_revision"
                  ? "bg-yellow-200 dark:bg-yellow-800"
                  : "bg-muted"
              }`}
            />

            {/* Step 3: Decision */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  status === "approved"
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                    : status === "needs_revision"
                    ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {status === "approved" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : status === "needs_revision" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>
              <span className="mt-1 text-xs">
                {status === "needs_revision" ? "Revise" : "Approve"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

