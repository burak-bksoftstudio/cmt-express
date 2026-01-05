
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Clock,
  Trash2,
  User,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Edit,
  Loader2,
} from "lucide-react";

export type ReviewStatus = "NOT_STARTED" | "DRAFT" | "SUBMITTED";

interface AssignmentCardProps {
  assignment: {
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
  };
  canDelete?: boolean;
  onDelete?: (assignmentId: string) => Promise<void>;
  index?: number;
}

const statusConfig: Record<
  ReviewStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  NOT_STARTED: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: Clock,
  },
  DRAFT: {
    label: "Draft",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Edit,
  },
  SUBMITTED: {
    label: "Submitted",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
};

export function AssignmentCard({
  assignment,
  canDelete = false,
  onDelete,
  index = 0,
}: AssignmentCardProps) {
  const [deleting, setDeleting] = useState(false);

  const status = statusConfig[assignment.status] || statusConfig.NOT_STARTED;
  const StatusIcon = status.icon;
  const reviewer = assignment.reviewer;

  const isOverdue =
    assignment.dueDate &&
    new Date(assignment.dueDate) < new Date() &&
    assignment.status !== "SUBMITTED";

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "??";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(assignment.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={cn(
          "transition-all hover:shadow-md",
          isOverdue && "border-red-300 dark:border-red-800"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Reviewer Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(reviewer?.firstName, reviewer?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {reviewer
                    ? `${reviewer.firstName} ${reviewer.lastName}`
                    : "Unknown Reviewer"}
                </p>
                {reviewer?.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    {reviewer.email}
                  </p>
                )}
              </div>
            </div>

            {/* Status & Due Date */}
            <div className="flex items-center gap-3 shrink-0">
              {assignment.dueDate && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-sm",
                    isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                  )}
                >
                  <Calendar className={cn("h-3.5 w-3.5", isOverdue && "animate-pulse")} />
                  <span className="hidden sm:inline">
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                  {isOverdue && (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                </div>
              )}
              <Badge className={status.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>

              {/* Delete Button */}
              {canDelete && assignment.status !== "SUBMITTED" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Assignment</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove this reviewer assignment? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

