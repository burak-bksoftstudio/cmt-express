
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useSimpleToast } from "@/components/ui/toast";
import { ReviewerList } from "./reviewer-list";
import { paperApi, biddingApi, conflictApi, reviewAssignmentApi } from "@/lib/api";
import { ReviewerAssignment, User, PaperBid, ReviewerConflict } from "@/types";
import {
  UserCheck,
  Wand2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Users,
} from "lucide-react";

interface AssignmentPanelProps {
  paperId: string;
  conferenceId?: string;
  canManage?: boolean;
  onUpdate?: () => void;
}

interface ReviewerData {
  reviewer: Partial<User>;
  assignment?: ReviewerAssignment;
  bid?: PaperBid;
  hasConflict?: boolean;
}

export function AssignmentPanel({
  paperId,
  conferenceId,
  canManage = true,
  onUpdate,
}: AssignmentPanelProps) {
  const { addToast, ToastRenderer } = useSimpleToast();

  const [reviewers, setReviewers] = useState<ReviewerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch current assignments
      const assignmentsRes = await paperApi.getAssignments(paperId);
      const assignments: (ReviewerAssignment & { reviewer?: Partial<User> })[] =
        assignmentsRes.data.data || [];

      // Fetch bids for this paper
      let bids: (PaperBid & { user?: Partial<User> })[] = [];
      try {
        const bidsRes = await biddingApi.getPaperBids(paperId);
        bids = bidsRes.data.data || [];
      } catch {
        // Bids might not be available
      }

      // Fetch conflicts for this paper
      let conflicts: (ReviewerConflict & { user?: Partial<User> })[] = [];
      try {
        const conflictsRes = await conflictApi.getPaperConflicts(paperId);
        conflicts = conflictsRes.data.data || [];
      } catch {
        // Conflicts might not be available
      }

      // Build unified reviewer list
      const reviewerMap = new Map<string, ReviewerData>();

      // Add assigned reviewers
      assignments.forEach((assignment) => {
        if (assignment.reviewer?.id) {
          reviewerMap.set(assignment.reviewer.id, {
            reviewer: assignment.reviewer,
            assignment,
            hasConflict: false,
          });
        }
      });

      // Add reviewers who bid
      bids.forEach((bid) => {
        if (bid.user?.id) {
          const existing = reviewerMap.get(bid.user.id);
          if (existing) {
            existing.bid = bid;
          } else {
            reviewerMap.set(bid.user.id, {
              reviewer: bid.user,
              bid,
              hasConflict: false,
            });
          }
        }
      });

      // Mark conflicts
      conflicts.forEach((conflict) => {
        if (conflict.user?.id) {
          const existing = reviewerMap.get(conflict.user.id);
          if (existing) {
            existing.hasConflict = true;
          } else {
            reviewerMap.set(conflict.user.id, {
              reviewer: conflict.user,
              hasConflict: true,
            });
          }
        }
      });

      setReviewers(Array.from(reviewerMap.values()));
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load assignment data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [paperId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-assign reviewers - requires conferenceId
  const handleAutoAssign = async () => {
    if (!conferenceId) {
      addToast({
        type: "error",
        title: "Error",
        description: "Conference ID is required for auto-assign",
      });
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      await reviewAssignmentApi.autoAssign(conferenceId, 3);
      addToast({
        type: "success",
        title: "Success",
        description: "Reviewers assigned successfully!",
      });
      fetchData();
      onUpdate?.();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to auto-assign reviewers";
      addToast({
        type: "error",
        title: "Error",
        description: message,
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Manual assign reviewer
  const handleAssign = async (reviewerId: string) => {
    try {
      await reviewAssignmentApi.create({
        paperId,
        reviewerId,
      });
      addToast({
        type: "success",
        title: "Assigned",
        description: "Reviewer assigned successfully",
      });
      fetchData();
      onUpdate?.();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to assign reviewer";
      addToast({
        type: "error",
        title: "Error",
        description: message,
      });
      throw err;
    }
  };

  // Unassign reviewer
  const handleUnassign = async (assignmentId: string) => {
    try {
      await reviewAssignmentApi.delete(assignmentId);
      addToast({
        type: "success",
        title: "Unassigned",
        description: "Reviewer unassigned successfully",
      });
      fetchData();
      onUpdate?.();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to unassign reviewer";
      addToast({
        type: "error",
        title: "Error",
        description: message,
      });
      throw err;
    }
  };

  // Stats
  const stats = {
    total: reviewers.length,
    assigned: reviewers.filter((r) => !!r.assignment).length,
    pending: reviewers.filter((r) => r.assignment?.status === "pending").length,
    completed: reviewers.filter((r) => r.assignment?.status === "completed").length,
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-9 w-40" />
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Assignment Panel
              </CardTitle>
              <CardDescription>
                Manage reviewer assignments for this paper
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {stats.assigned} / {stats.total} assigned
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={fetchData}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {canManage && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAutoAssign}
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Auto-Assign
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Quick Stats */}
        {stats.assigned > 0 && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                    <p className="text-xl font-bold">{stats.assigned}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold">{stats.pending}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold">{stats.completed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <UserCheck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Available</p>
                    <p className="text-xl font-bold">{stats.total - stats.assigned}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reviewer List */}
      <Card>
        <CardContent className="pt-6">
          {reviewers.length > 0 ? (
            <ReviewerList
              reviewers={reviewers}
              canManage={canManage}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <UserCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No reviewers available</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {canManage
                  ? "Use Auto-Assign to automatically assign reviewers based on their expertise."
                  : "No reviewers have been assigned to this paper yet."}
              </p>
              {canManage && (
                <Button
                  className="mt-4"
                  onClick={handleAutoAssign}
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Auto-Assign Reviewers
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toast Renderer */}
      <ToastRenderer />
    </div>
  );
}

