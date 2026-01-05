
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { decisionApi } from "@/lib/api";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Gavel,
  AlertCircle,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

type DecisionValue = "accept" | "reject";

interface MakeDecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperId: string;
  paperTitle?: string;
  existingDecision?: DecisionValue | null;
  existingComment?: string;
  onSuccess: () => void;
}

const decisionOptions: {
  value: DecisionValue;
  label: string;
  description: string;
}[] = [
  {
    value: "accept",
    label: "Accept",
    description: "Paper will be accepted for publication",
  },
  {
    value: "reject",
    label: "Reject",
    description: "Paper will be rejected",
  },
];

export function MakeDecisionModal({
  open,
  onOpenChange,
  paperId,
  paperTitle,
  existingDecision,
  existingComment,
  onSuccess,
}: MakeDecisionModalProps) {
  const [selectedDecision, setSelectedDecision] = useState<DecisionValue | "">(
    existingDecision || ""
  );
  const [comment, setComment] = useState(existingComment || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) {
        setSelectedDecision(existingDecision || "");
        setComment(existingComment || "");
        setError(null);
        setSuccess(false);
      }
      onOpenChange(newOpen);
    },
    [existingDecision, existingComment, onOpenChange]
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedDecision) return;

    setSubmitting(true);
    setError(null);

    try {
      await decisionApi.makeDecision(paperId, {
        finalDecision: selectedDecision,
        comment: comment.trim() || undefined,
      });

      setSuccess(true);

      // Close modal and refresh after short delay
      setTimeout(() => {
        onOpenChange(false);
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "Failed to submit decision";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [paperId, selectedDecision, comment, onOpenChange, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            {existingDecision ? "Update Paper Decision" : "Make Paper Decision"}
          </DialogTitle>
          <DialogDescription>
            {paperTitle ? (
              <>Review &ldquo;{paperTitle}&rdquo; and provide your final decision.</>
            ) : (
              "Review the paper and provide your final decision based on reviewer feedback."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Success Alert */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: appleEasing }}
              >
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700 dark:text-green-400">
                    Decision Submitted!
                  </AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-500">
                    Paper has been {selectedDecision === "accept" ? "accepted" : "rejected"}.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: appleEasing }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decision Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Decision *</Label>
            <div className="grid grid-cols-2 gap-3">
              {decisionOptions.map((option) => {
                const isSelected = selectedDecision === option.value;
                const isAccept = option.value === "accept";

                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedDecision(option.value)}
                    disabled={submitting || success}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? isAccept
                          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                          : "border-red-500 bg-red-50 dark:bg-red-950/30"
                        : "border-muted hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        isAccept
                          ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                          : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                      }`}
                    >
                      {isAccept ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <XCircle className="h-6 w-6" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Comment */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Comments <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any comments about your decision..."
              rows={4}
              className="resize-none"
              disabled={submitting || success}
            />
            <p className="text-xs text-muted-foreground">
              These comments will be visible to authors and other committee members.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDecision || submitting || success}
            className={`w-full sm:w-auto ${
              selectedDecision === "accept"
                ? "bg-green-600 hover:bg-green-700"
                : selectedDecision === "reject"
                ? "bg-red-600 hover:bg-red-700"
                : ""
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Submitted!
              </>
            ) : (
              <>
                {selectedDecision === "accept" ? (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                ) : selectedDecision === "reject" ? (
                  <XCircle className="mr-2 h-4 w-4" />
                ) : (
                  <Gavel className="mr-2 h-4 w-4" />
                )}
                {existingDecision ? "Update Decision" : "Submit Decision"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

