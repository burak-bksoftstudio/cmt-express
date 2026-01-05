
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { conferenceMembersApi, reviewAssignmentApi } from "@/lib/api";
import { useSimpleToast } from "@/components/ui/toast";
import {
  UserPlus,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";

interface ConferenceMember {
  id: string;
  conferenceId: string;
  userId: string;
  role: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AssignmentAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperId: string;
  conferenceId: string;
  existingReviewerIds: string[];
  authorIds: string[];
  onSuccess: () => void;
}

export function AssignmentAddModal({
  open,
  onOpenChange,
  paperId,
  conferenceId,
  existingReviewerIds,
  authorIds,
  onSuccess,
}: AssignmentAddModalProps) {
  const [members, setMembers] = useState<ConferenceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { addToast, ToastRenderer } = useSimpleToast();

  // Fetch conference members (reviewers only)
  useEffect(() => {
    const fetchMembers = async () => {
      if (!open || !conferenceId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await conferenceMembersApi.getMembers(conferenceId);
        const allMembers = response.data?.data || [];
        // Filter to only REVIEWER and CHAIR roles
        const reviewers = allMembers.filter(
          (m: ConferenceMember) =>
            m.role?.toUpperCase() === "REVIEWER" || m.role?.toUpperCase() === "CHAIR"
        );
        setMembers(reviewers);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        setError("Failed to load reviewers. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [open, conferenceId]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setSelectedReviewerId("");
      setDueDate("");
      setError(null);
    }
  }, [open]);

  // Filter out existing reviewers and authors
  const availableReviewers = members.filter((m) => {
    const userId = m.user?.id || m.userId;
    // Exclude already assigned reviewers
    if (existingReviewerIds.includes(userId)) return false;
    // Exclude paper authors
    if (authorIds.includes(userId)) return false;
    return true;
  });

  const handleSubmit = async () => {
    if (!selectedReviewerId) {
      setError("Please select a reviewer");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await reviewAssignmentApi.create({
        paperId,
        reviewerId: selectedReviewerId,
        dueDate: dueDate || undefined,
      });

      addToast({
        type: "success",
        title: "Assignment created",
        description: "Reviewer has been assigned to this paper.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to create assignment";
      setError(message);
      addToast({
        type: "error",
        title: "Failed to assign",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Assign Reviewer
              </DialogTitle>
              <DialogDescription>
                Select a reviewer to assign to this paper.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reviewer Select */}
              <div className="space-y-2">
                <Label htmlFor="reviewer">Reviewer *</Label>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedReviewerId}
                    onValueChange={setSelectedReviewerId}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reviewer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableReviewers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          No available reviewers
                        </div>
                      ) : (
                        availableReviewers.map((member) => {
                          const user = member.user;
                          const userId = user?.id || member.userId;
                          return (
                            <SelectItem key={userId} value={userId}>
                              <div className="flex items-center gap-2">
                                <span>
                                  {user
                                    ? `${user.firstName} ${user.lastName}`
                                    : "Unknown"}
                                </span>
                                {user?.email && (
                                  <span className="text-muted-foreground text-xs">
                                    ({user.email})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  {availableReviewers.length} reviewer(s) available
                </p>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date (Optional)
                </Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Set a deadline for the reviewer to complete their review.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedReviewerId || loading}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Assign Reviewer
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
      <ToastRenderer />
    </>
  );
}

