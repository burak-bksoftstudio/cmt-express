import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { paperApi, api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileText,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CameraReadyFile {
  id: string;
  fileName: string;
  uploadedAt: string;
  status: string;
  reviewerComment?: string;
}

interface PaperWithCameraReady {
  id: string;
  title: string;
  authors: { user: { firstName: string; lastName: string } }[];
  cameraReadyFiles?: CameraReadyFile[];
  decision?: {
    decision: string;
  };
}

export default function ConferenceCameraReadyPage() {
  const params = useParams();
  const conferenceId = params.id as string;
  const { toast } = useToast();

  const [papers, setPapers] = useState<PaperWithCameraReady[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<PaperWithCameraReady | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        // Get all accepted papers in the conference
        const response = await api.get(`/conferences/${conferenceId}/papers`);
        const allPapers = response.data.data || response.data;

        // Filter only accepted papers
        const acceptedPapers = allPapers.filter(
          (p: PaperWithCameraReady) => p.decision?.decision === "ACCEPT"
        );

        setPapers(acceptedPapers);
      } catch (error: any) {
        console.error("Failed to fetch papers:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load camera-ready submissions",
        });
      } finally {
        setLoading(false);
      }
    };

    if (conferenceId) {
      fetchPapers();
    }
  }, [conferenceId, toast]);

  const getLatestFile = (paper: PaperWithCameraReady): CameraReadyFile | null => {
    if (!paper.cameraReadyFiles || paper.cameraReadyFiles.length === 0) {
      return null;
    }
    return paper.cameraReadyFiles[paper.cameraReadyFiles.length - 1];
  };

  const getStatusInfo = (file: CameraReadyFile | null) => {
    if (!file) {
      return {
        status: "pending",
        label: "Not Submitted",
        variant: "secondary" as const,
        icon: <Clock className="h-4 w-4" />,
      };
    }

    switch (file.status) {
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
          icon: <XCircle className="h-4 w-4" />,
        };
      default:
        return {
          status: "submitted",
          label: "Pending Review",
          variant: "warning" as const,
          icon: <Clock className="h-4 w-4" />,
        };
    }
  };

  const handleAction = async () => {
    if (!selectedPaper || !actionType) return;

    setProcessing(true);
    try {
      const endpoint =
        actionType === "approve"
          ? `/camera-ready-approval/papers/${selectedPaper.id}/approve`
          : `/camera-ready-approval/papers/${selectedPaper.id}/reject`;

      await api.post(endpoint, {
        comment: comment.trim() || undefined,
      });

      toast({
        title: actionType === "approve" ? "Approved" : "Revision Requested",
        description: `Camera-ready file ${
          actionType === "approve" ? "approved" : "sent back for revision"
        }`,
      });

      // Refresh papers
      const response = await api.get(`/conferences/${conferenceId}/papers`);
      const allPapers = response.data.data || response.data;
      const acceptedPapers = allPapers.filter(
        (p: PaperWithCameraReady) => p.decision?.decision === "ACCEPT"
      );
      setPapers(acceptedPapers);

      // Close dialog
      setSelectedPaper(null);
      setActionType(null);
      setComment("");
    } catch (error: any) {
      console.error("Failed to process action:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to process action",
      });
    } finally {
      setProcessing(false);
    }
  };

  const stats = {
    total: papers.length,
    submitted: papers.filter((p) => getLatestFile(p) !== null).length,
    pending: papers.filter((p) => {
      const file = getLatestFile(p);
      return file && file.status === "submitted";
    }).length,
    approved: papers.filter((p) => {
      const file = getLatestFile(p);
      return file && file.status === "approved";
    }).length,
    needsRevision: papers.filter((p) => {
      const file = getLatestFile(p);
      return file && file.status === "needs_revision";
    }).length,
  };

  return (
    <DashboardLayout allowedRoles={["chair", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={`/conferences/${conferenceId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Camera className="h-8 w-8" />
              Camera-Ready Approval
            </h1>
            <p className="text-muted-foreground">Review and approve camera-ready submissions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submitted}</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Needs Revision</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.needsRevision}</div>
            </CardContent>
          </Card>
        </div>

        {/* Papers List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
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
                No accepted papers in this conference yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => {
              const latestFile = getLatestFile(paper);
              const statusInfo = getStatusInfo(latestFile);

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
                                Authors:{" "}
                                {paper.authors
                                  ?.map((a) => `${a.user.firstName} ${a.user.lastName}`)
                                  .join(", ")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                      </div>

                      {latestFile && (
                        <>
                          {/* File Info */}
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <div className="flex items-center justify-between">
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
                          </div>

                          {/* Reviewer Comment */}
                          {latestFile.reviewerComment && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="mt-0.5 h-4 w-4 text-amber-600" />
                                <div>
                                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                    Previous Comment
                                  </p>
                                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                    {latestFile.reviewerComment}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Actions */}
                      {latestFile && latestFile.status === "submitted" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950"
                            onClick={() => {
                              setSelectedPaper(paper);
                              setActionType("approve");
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                            onClick={() => {
                              setSelectedPaper(paper);
                              setActionType("reject");
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Request Revision
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog
        open={!!selectedPaper && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPaper(null);
            setActionType(null);
            setComment("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Camera-Ready" : "Request Revision"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Approve this camera-ready submission for publication"
                : "Request revisions for this camera-ready submission"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Paper</p>
              <p className="text-sm text-muted-foreground">{selectedPaper?.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium">
                {actionType === "approve" ? "Comment (optional)" : "Revision Comment"}
              </label>
              <Textarea
                placeholder={
                  actionType === "approve"
                    ? "Add a comment..."
                    : "Explain what needs to be revised..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPaper(null);
                setActionType(null);
                setComment("");
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={processing}>
              {processing ? "Processing..." : actionType === "approve" ? "Approve" : "Request Revision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
