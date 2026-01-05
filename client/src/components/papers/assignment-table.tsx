
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReviewerAssignment, User } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  CalendarClock,
} from "lucide-react";

interface AssignmentTableProps {
  assignments: (ReviewerAssignment & { reviewer?: Partial<User> })[];
  loading?: boolean;
}

// Status configuration with colors matching requirements
const statusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  declined: {
    label: "Declined",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  submitted: {
    label: "Submitted",
    icon: <Send className="h-3.5 w-3.5" />,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  expired: {
    label: "Expired",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
};

// Loading skeleton rows
function TableSkeletons() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function AssignmentTable({ assignments, loading }: AssignmentTableProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "??";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Check if assignment is expired
  const isExpired = (assignment: ReviewerAssignment) => {
    if (!assignment.expiresAt) return false;
    return new Date(assignment.expiresAt) < new Date() && assignment.status === "pending";
  };

  // Get days until expiry
  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Empty state
  if (!loading && assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <UserIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-medium">No reviewer assignments</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          No reviewers have been assigned to this paper yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-medium">
              <span className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Reviewer
              </span>
            </TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Assigned
              </span>
            </TableHead>
            <TableHead className="font-medium">
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Expires
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeletons />
          ) : (
            assignments.map((assignment) => {
              const expired = isExpired(assignment);
              const config = expired
                ? statusConfig.expired
                : statusConfig[assignment.status] || statusConfig.pending;
              const daysUntilExpiry = assignment.expiresAt
                ? getDaysUntilExpiry(assignment.expiresAt)
                : null;
              const isExpiringSoon =
                daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 3;

              return (
                <TableRow
                  key={assignment.id}
                  className={expired ? "bg-red-50/50 dark:bg-red-950/10" : ""}
                >
                  {/* Reviewer */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(
                            assignment.reviewer?.firstName,
                            assignment.reviewer?.lastName
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {assignment.reviewer?.firstName || "Unknown"}{" "}
                          {assignment.reviewer?.lastName || "Reviewer"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.reviewer?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant="outline" className={config.className}>
                      <span className="flex items-center gap-1.5">
                        {config.icon}
                        {config.label}
                      </span>
                    </Badge>
                  </TableCell>

                  {/* Assigned At */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {assignment.assignedAt ? formatDate(assignment.assignedAt) : "—"}
                    </span>
                  </TableCell>

                  {/* Expires At */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm ${
                          expired
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : isExpiringSoon
                            ? "text-orange-600 dark:text-orange-400 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {assignment.expiresAt ? formatDate(assignment.expiresAt) : "—"}
                      </span>
                      {daysUntilExpiry !== null && !expired && (
                        <span
                          className={`text-xs ${
                            isExpiringSoon
                              ? "text-orange-500 dark:text-orange-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {daysUntilExpiry === 0
                            ? "Expires today"
                            : daysUntilExpiry === 1
                            ? "Expires tomorrow"
                            : `${daysUntilExpiry} days left`}
                        </span>
                      )}
                      {expired && (
                        <span className="text-xs text-red-500 dark:text-red-400">
                          Expired
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
