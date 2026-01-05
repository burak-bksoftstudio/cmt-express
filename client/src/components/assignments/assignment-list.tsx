
import { AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignmentCard, ReviewStatus } from "./assignment-card";
import { UserX } from "lucide-react";

interface Assignment {
  id: string;
  paperId: string;
  reviewerId: string;
  status: ReviewStatus;
  dueDate?: string;
  createdAt: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AssignmentListProps {
  assignments: Assignment[];
  loading?: boolean;
  canDelete?: boolean;
  onDelete?: (assignmentId: string) => Promise<void>;
  emptyMessage?: string;
}

function AssignmentSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AssignmentList({
  assignments,
  loading = false,
  canDelete = false,
  onDelete,
  emptyMessage = "No reviewers assigned yet",
}: AssignmentListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <AssignmentSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <UserX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-medium">{emptyMessage}</h3>
          <p className="mt-1 text-xs text-muted-foreground text-center max-w-sm">
            Use the button above to assign reviewers to this paper.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {assignments.map((assignment, index) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            canDelete={canDelete}
            onDelete={onDelete}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

