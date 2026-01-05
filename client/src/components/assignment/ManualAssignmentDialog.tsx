import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, X } from "lucide-react";
import { reviewAssignmentApi, api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Reviewer {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role: string;
}

interface Assignment {
  assignmentId: string;
  reviewerId: string;
  reviewerName: string;
  status: string;
}

interface ManualAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperId: string;
  paperTitle: string;
  conferenceId: string;
  existingAssignments: Assignment[];
  onAssignmentChange: () => void;
}

export function ManualAssignmentDialog({
  open,
  onOpenChange,
  paperId,
  paperTitle,
  conferenceId,
  existingAssignments,
  onAssignmentChange,
}: ManualAssignmentDialogProps) {
  const { toast } = useToast();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviewers = async () => {
      if (!open || !conferenceId) return;

      setLoading(true);
      try {
        // Fetch conference members
        const response = await api.get(`/conferences/${conferenceId}/members`);
        const members = response.data?.data || response.data || [];

        // Filter only reviewers and chairs
        const reviewerMembers = members.filter(
          (m: Reviewer) => m.role === "REVIEWER" || m.role === "CHAIR"
        );

        setReviewers(reviewerMembers);
      } catch (error) {
        console.error("Failed to fetch reviewers:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load reviewers",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviewers();
  }, [open, conferenceId, toast]);

  const handleAssign = async () => {
    if (!selectedReviewerId) return;

    setAssigning(true);
    try {
      await api.post("/assignments/create", {
        paperId,
        reviewerId: selectedReviewerId,
      });

      toast({
        title: "Reviewer Assigned",
        description: "Reviewer has been successfully assigned to this paper",
      });

      setSelectedReviewerId("");
      onAssignmentChange();
    } catch (error: any) {
      console.error("Failed to assign reviewer:", error);
      toast({
        variant: "destructive",
        title: "Assignment Failed",
        description: error.response?.data?.message || "Failed to assign reviewer",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    setRemoving(assignmentId);
    try {
      await api.delete(`/assignments/${assignmentId}`);

      toast({
        title: "Assignment Removed",
        description: "Reviewer assignment has been removed",
      });

      onAssignmentChange();
    } catch (error: any) {
      console.error("Failed to remove assignment:", error);
      toast({
        variant: "destructive",
        title: "Removal Failed",
        description: error.response?.data?.message || "Failed to remove assignment",
      });
    } finally {
      setRemoving(null);
    }
  };

  // Filter out already assigned reviewers
  const availableReviewers = reviewers.filter(
    (r) => !existingAssignments.some((a) => a.reviewerId === r.userId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Reviewers</DialogTitle>
          <DialogDescription>
            Assign or remove reviewers for: <strong>{paperTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Assignments */}
          {existingAssignments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Current Assignments</h4>
              <div className="space-y-2">
                {existingAssignments.map((assignment, index) => (
                  <div
                    key={`${assignment.reviewerId}-${index}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">{assignment.reviewerName}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {assignment.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(assignment.assignmentId)}
                      disabled={removing === assignment.assignmentId}
                    >
                      {removing === assignment.assignmentId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Assignment */}
          <div>
            <h4 className="text-sm font-medium mb-3">Assign New Reviewer</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : availableReviewers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All available reviewers have been assigned
              </p>
            ) : (
              <div className="flex gap-2">
                <Select value={selectedReviewerId} onValueChange={setSelectedReviewerId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReviewers.map((reviewer) => (
                      <SelectItem key={reviewer.userId} value={reviewer.userId}>
                        {reviewer.user.firstName} {reviewer.user.lastName} ({reviewer.user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedReviewerId || assigning}
                >
                  {assigning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
