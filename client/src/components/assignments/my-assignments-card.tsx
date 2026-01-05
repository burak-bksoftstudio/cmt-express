
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { reviewAssignmentApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  Edit,
  CheckCircle,
  AlertTriangle,
  Calendar,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface Assignment {
  id: string;
  paperId: string;
  reviewerId: string;
  status: "NOT_STARTED" | "DRAFT" | "SUBMITTED";
  dueDate?: string;
  createdAt: string;
  paper?: {
    id: string;
    title: string;
    abstract?: string;
    conference?: {
      id: string;
      name: string;
    };
    track?: {
      id: string;
      name: string;
    };
  };
}

const statusConfig = {
  NOT_STARTED: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: Clock,
  },
  DRAFT: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Edit,
  },
  SUBMITTED: {
    label: "Submitted",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
};

export function MyAssignmentsCard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssignments = async () => {
    try {
      const response = await reviewAssignmentApi.getMyAssignments();
      const data = response.data?.data || [];
      setAssignments(data);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const pendingAssignments = assignments.filter((a) => a.status !== "SUBMITTED");
  const completedAssignments = assignments.filter((a) => a.status === "SUBMITTED");

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              My Review Assignments
            </CardTitle>
            <CardDescription>
              Papers assigned to you for review
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {pendingAssignments.length} pending
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No papers assigned to you yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {pendingAssignments.slice(0, 5).map((assignment, index) => {
                const status = statusConfig[assignment.status];
                const StatusIcon = status.icon;
                const isOverdue =
                  assignment.dueDate &&
                  new Date(assignment.dueDate) < new Date() &&
                  assignment.status !== "SUBMITTED";

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/papers/${assignment.paperId}`}>
                      <div
                        className={cn(
                          "group rounded-lg border p-3 transition-all hover:bg-accent hover:shadow-xs cursor-pointer",
                          isOverdue && "border-red-300 dark:border-red-800"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                              {assignment.paper?.title || "Untitled Paper"}
                            </p>
                            {assignment.paper?.conference && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {assignment.paper.conference.name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={cn("text-xs", status.color)}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {status.label}
                              </Badge>
                              {assignment.dueDate && (
                                <span
                                  className={cn(
                                    "text-xs flex items-center gap-1",
                                    isOverdue
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="h-3 w-3" />
                                  {new Date(assignment.dueDate).toLocaleDateString()}
                                  {isOverdue && (
                                    <AlertTriangle className="h-3 w-3" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {pendingAssignments.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{pendingAssignments.length - 5} more pending
              </p>
            )}

            {/* Completed Summary */}
            {completedAssignments.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {completedAssignments.length} completed
                  </span>
                  <Link to="/reviews">
                    <Button variant="ghost" size="sm" className="gap-1 h-7">
                      View All
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

