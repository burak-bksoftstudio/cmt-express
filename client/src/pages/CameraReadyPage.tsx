import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Paper, CameraReadyFile } from "@/types";
import { formatDate } from "@/lib/utils";
import { paperApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  MessageSquare
} from "lucide-react";

interface PaperWithCameraReady extends Paper {
  cameraReadyFiles?: CameraReadyFile[];
}

export default function CameraReadyPage() {
  const [papers, setPapers] = useState<PaperWithCameraReady[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await paperApi.getMyPapers();
        // Filter only accepted papers
        const acceptedPapers = response.data.data.filter(
          (paper: PaperWithCameraReady) => paper.status === "accepted"
        );
        setPapers(acceptedPapers);
      } catch (error: any) {
        console.error("Failed to fetch papers:", error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to fetch papers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [toast]);

  const getStatusInfo = (paper: PaperWithCameraReady) => {
    const latestFile = paper.cameraReadyFiles?.[paper.cameraReadyFiles.length - 1];

    if (!latestFile) {
      return {
        status: "pending",
        label: "Upload Pending",
        variant: "warning" as const,
        icon: <Clock className="h-4 w-4" />,
      };
    }

    switch (latestFile.status) {
      case "approved":
        return {
          status: "approved",
          label: "Approved",
          variant: "success" as const,
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case "needs_revision":
        return {
          status: "needs_revision",
          label: "Needs Revision",
          variant: "destructive" as const,
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      default:
        return {
          status: "submitted",
          label: "Under Review",
          variant: "secondary" as const,
          icon: <Eye className="h-4 w-4" />,
        };
    }
  };

  const stats = {
    total: papers.length,
    approved: papers.filter((p) => getStatusInfo(p).status === "approved").length,
    needsRevision: papers.filter((p) => getStatusInfo(p).status === "needs_revision").length,
    pending: papers.filter((p) => getStatusInfo(p).status === "pending").length,
  };

  return (
    <DashboardLayout allowedRoles={["author", "chair", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Camera Ready</h1>
          <p className="text-muted-foreground">
            Upload final versions of your accepted papers
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Accepted Papers</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.needsRevision}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upload Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Papers List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-9 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Camera className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Accepted Papers</h3>
              <p className="mt-2 text-center text-muted-foreground">
                You don't have any accepted papers requiring camera-ready uploads yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => {
              const statusInfo = getStatusInfo(paper);
              const latestFile = paper.cameraReadyFiles?.[paper.cameraReadyFiles.length - 1];

              return (
                <Card key={paper.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <FileText className="mt-1 h-5 w-5 text-muted-foreground shrink-0" />
                            <div>
                              <h3 className="font-semibold leading-tight">{paper.title}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Paper ID: {paper.id}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                      </div>

                      {/* Revision Comment */}
                      {latestFile?.status === "needs_revision" && latestFile.reviewerComment && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="mt-0.5 h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                Reviewer Comment
                              </p>
                              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                {latestFile.reviewerComment}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* File Info */}
                      {latestFile && (
                        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{latestFile.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded {formatDate(latestFile.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {statusInfo.status === "pending" || statusInfo.status === "needs_revision" ? (
                          <Link to={`/camera-ready/${paper.id}/upload`} className="flex-1">
                            <Button className="w-full">
                              <Upload className="mr-2 h-4 w-4" />
                              {statusInfo.status === "needs_revision" ? "Upload Revised Version" : "Upload Camera Ready"}
                            </Button>
                          </Link>
                        ) : statusInfo.status === "approved" ? (
                          <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                              Camera Ready Approved
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted p-3">
                            <Eye className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Under Review
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
