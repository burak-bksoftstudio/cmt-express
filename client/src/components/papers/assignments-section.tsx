
import { useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignmentTable } from "./assignment-table";
import { api } from "@/lib/api";
import { ReviewerAssignment, User } from "@/types";
import {
  UserCheck,
  Wand2,
  Loader2,
  AlertCircle,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  RefreshCw,
} from "lucide-react";

interface AssignmentsSectionProps {
  paperId: string;
  assignments: (ReviewerAssignment & { reviewer?: Partial<User> })[];
  canManage: boolean;
  loading?: boolean;
  onUpdate: () => void;
}

// Loading skeleton for the entire section
function AssignmentsSkeletons() {
  return (
    <div className="space-y-6">
      {/* Header Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-9 w-40" />
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AssignmentsSection({
  paperId,
  assignments,
  canManage,
  loading = false,
  onUpdate,
}: AssignmentsSectionProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const pending = assignments.filter((a) => a.status === "pending").length;
    const accepted = assignments.filter((a) => a.status === "accepted").length;
    // "declined" is the actual status value from backend
    const rejected = assignments.filter((a) => a.status === "declined").length;
    // "completed" is the actual status value from backend
    const submitted = assignments.filter((a) => a.status === "completed").length;
    const expired = assignments.filter((a) => {
      if (!a.expiresAt) return false;
      return new Date(a.expiresAt) < new Date() && a.status === "pending";
    }).length;

    return { total, pending, accepted, rejected, submitted, expired };
  }, [assignments]);

  const handleAutoAssign = async () => {
    setIsAssigning(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the auto-assign endpoint with reviewersNeeded parameter
      await api.post(`/reviewer-assignments/auto-assign/${paperId}`, {
        reviewersNeeded: 1,
      });
      setSuccess("Reviewers assigned successfully!");
      onUpdate();
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to auto-assign reviewers. Please try again.";
      setError(message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRefresh = () => {
    setError(null);
    setSuccess(null);
    onUpdate();
  };

  // Loading state
  if (loading) {
    return <AssignmentsSkeletons />;
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Reviewer Assignments
              </CardTitle>
              <CardDescription>
                Manage reviewer assignments for this paper
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {stats.total} {stats.total === 1 ? "reviewer" : "reviewers"} assigned
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
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
                      Auto-Assign Reviewers
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Statistics */}
        {stats.total > 0 && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {/* Total */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                </div>

                {/* Pending */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold">{stats.pending}</p>
                  </div>
                </div>

                {/* Accepted */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Accepted</p>
                    <p className="text-xl font-bold">{stats.accepted}</p>
                  </div>
                </div>

                {/* Rejected */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                    <p className="text-xl font-bold">{stats.rejected}</p>
                  </div>
                </div>

                {/* Submitted */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-xl font-bold">{stats.submitted}</p>
                  </div>
                </div>
              </div>

              {/* Expired Warning */}
              {stats.expired > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Expired Assignments</AlertTitle>
                  <AlertDescription>
                    {stats.expired} assignment(s) have expired without response.
                    Consider reassigning to other reviewers.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </>
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-green-700 dark:text-green-300">
            <span>{success}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuccess(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Assignments Table */}
      {stats.total > 0 ? (
        <Card>
          <CardContent className="p-0">
            <AssignmentTable assignments={assignments} loading={false} />
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <UserCheck className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">No reviewers assigned</h3>
            <p className="mt-2 max-w-sm text-center text-muted-foreground">
              {canManage
                ? "Click the button below to automatically assign reviewers based on their expertise and availability."
                : "No reviewers have been assigned to this paper yet. Contact a conference chair or admin to assign reviewers."}
            </p>
            {canManage && (
              <Button
                className="mt-6"
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
          </CardContent>
        </Card>
      )}

      {/* Info Card for Admins */}
      {canManage && stats.total > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  <strong>{stats.accepted + stats.submitted}</strong> of {stats.total} reviewers active
                </span>
                {stats.pending > 0 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                    {stats.pending} awaiting response
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground">
                Use &quot;Auto-Assign Reviewers&quot; to add more reviewers
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
