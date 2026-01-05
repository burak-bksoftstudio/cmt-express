
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { reviewAssignmentApi } from "@/lib/api";
import { useSimpleToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Wand2,
  CheckCircle,
  Clock,
  Edit,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface AssignmentStats {
  total: number;
  notStarted: number;
  draft: number;
  submitted: number;
}

interface AssignmentHeaderProps {
  paperId: string;
  conferenceId: string;
  stats: AssignmentStats;
  canManage: boolean;
  onAddClick: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function AssignmentHeader({
  paperId,
  conferenceId,
  stats,
  canManage,
  onAddClick,
  onRefresh,
  loading = false,
}: AssignmentHeaderProps) {
  const [autoAssigning, setAutoAssigning] = useState(false);
  const { addToast, ToastRenderer } = useSimpleToast();

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const response = await reviewAssignmentApi.autoAssign(conferenceId);
      const result = response.data?.data;
      
      addToast({
        type: "success",
        title: "Auto-assignment completed",
        description: `${result?.totalAssigned || 0} assignments created.`,
      });
      
      onRefresh();
    } catch (error: any) {
      const message = error.response?.data?.message || "Auto-assignment failed";
      addToast({
        type: "error",
        title: "Auto-assignment failed",
        description: message,
      });
    } finally {
      setAutoAssigning(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Reviewer Assignments
              </CardTitle>
              <CardDescription>
                {canManage
                  ? "Manage reviewer assignments for this paper"
                  : "Reviewers assigned to this paper"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {stats.total} assigned
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Stats Grid */}
        {stats.total > 0 && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Not Started */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Not Started</p>
                    <p className="text-xl font-bold">{stats.notStarted}</p>
                  </div>
                </motion.div>

                {/* Draft */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Edit className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                    <p className="text-xl font-bold">{stats.draft}</p>
                  </div>
                </motion.div>

                {/* Submitted */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-xl font-bold">{stats.submitted}</p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </>
        )}

        {/* Actions for Chair/Admin */}
        {canManage && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={onAddClick} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add Reviewer
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAutoAssign}
                  disabled={autoAssigning}
                  className="gap-2"
                >
                  {autoAssigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Auto-Assign
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Auto-assign will distribute papers based on reviewer bids and load balancing.
              </p>
            </CardContent>
          </>
        )}
      </Card>
      <ToastRenderer />
    </>
  );
}

