
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { AssignmentHeader } from "./assignment-header";
import { AssignmentList } from "./assignment-list";
import { AssignmentAddModal } from "./assignment-add-modal";
import { ReviewStatus } from "./assignment-card";
import { reviewAssignmentApi } from "@/lib/api";
import { useSimpleToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";

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

interface AssignmentsSectionProps {
  paperId: string;
  conferenceId: string;
  authorIds?: string[];
}

export function AssignmentsSection({
  paperId,
  conferenceId,
  authorIds = [],
}: AssignmentsSectionProps) {
  const { user, permissions, isChairOfConference } = useAuth();
  const { addToast, ToastRenderer } = useSimpleToast();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const isAdmin = permissions.isAdmin;
  const isChair = isChairOfConference(conferenceId);
  const canManage = isAdmin || isChair;

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reviewAssignmentApi.getForPaper(paperId);
      const data = response.data?.data || [];
      setAssignments(data);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      addToast({
        type: "error",
        title: "Failed to load assignments",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [paperId, addToast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Calculate stats
  const stats = useMemo(() => {
    const notStarted = assignments.filter((a) => a.status === "NOT_STARTED").length;
    const draft = assignments.filter((a) => a.status === "DRAFT").length;
    const submitted = assignments.filter((a) => a.status === "SUBMITTED").length;
    return {
      total: assignments.length,
      notStarted,
      draft,
      submitted,
    };
  }, [assignments]);

  // Get existing reviewer IDs
  const existingReviewerIds = useMemo(
    () => assignments.map((a) => a.reviewerId),
    [assignments]
  );

  // Handle delete
  const handleDelete = async (assignmentId: string) => {
    try {
      await reviewAssignmentApi.delete(assignmentId);
      addToast({
        type: "success",
        title: "Assignment removed",
        description: "Reviewer has been unassigned from this paper.",
      });
      fetchAssignments();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to remove assignment";
      addToast({
        type: "error",
        title: "Failed to remove",
        description: message,
      });
      throw error;
    }
  };

  // Filter for reviewer view (only show their own assignment)
  const visibleAssignments = canManage
    ? assignments
    : assignments.filter((a) => a.reviewerId === user?.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with stats and actions */}
      <AssignmentHeader
        paperId={paperId}
        conferenceId={conferenceId}
        stats={stats}
        canManage={canManage}
        onAddClick={() => setAddModalOpen(true)}
        onRefresh={fetchAssignments}
        loading={loading}
      />

      {/* Assignment List */}
      <AssignmentList
        assignments={visibleAssignments}
        loading={loading}
        canDelete={canManage}
        onDelete={handleDelete}
        emptyMessage={
          canManage
            ? "No reviewers assigned yet"
            : "You are not assigned to this paper"
        }
      />

      {/* Add Modal */}
      {canManage && (
        <AssignmentAddModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          paperId={paperId}
          conferenceId={conferenceId}
          existingReviewerIds={existingReviewerIds}
          authorIds={authorIds}
          onSuccess={fetchAssignments}
        />
      )}

      <ToastRenderer />
    </motion.div>
  );
}

