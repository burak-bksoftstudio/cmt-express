import { t } from "@/lib/i18n";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DecisionSummary } from "./decision-summary";
import { DecisionHistory } from "./decision-history";
import { decisionApi, DecisionType } from "@/lib/api";
import { useSimpleToast } from "@/components/ui/toast";
import {
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  AlertCircle,
  Gavel,
  Loader2,
  RefreshCw,
  Star,
  Shield,
  Users,
  TrendingUp,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface ReviewScore {
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  score: number | null;
  confidence: number | null;
  recommendation: string | null;
  submittedAt: string | null;
}

interface ReviewStats {
  scores: ReviewScore[];
  averageScore: number;
  averageConfidence: number;
  reviewCount: number;
  completedReviewCount: number;
  pendingReviewCount: number;
}

interface DecisionData {
  id: string;
  paperId: string;
  decision: string;
  finalDecision: string | null;
  comment: string | null;
  averageScore: number | null;
  averageConfidence: number | null;
  reviewCount: number | null;
  decidedAt: string;
}

interface DecidedBy {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface DecisionPanelProps {
  paperId: string;
  paperTitle: string;
  conferenceId: string;
  decision?: DecisionData | null;
  reviewStats: ReviewStats;
  decidedBy?: DecidedBy | null;
  canMakeDecision: boolean;
  loading?: boolean;
  onUpdate: () => void;
}

// Decision options with CONDITIONAL_ACCEPT
const decisionOptions: {
  value: DecisionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  className: string;
}[] = [
  {
    value: "accept",
    label: "Accept",
    description: "Accept for publication",
    icon: <CheckCircle2 className="h-6 w-6" />,
    className: "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-600",
  },
  {
    value: "conditional_accept",
    label: "Conditional Accept",
    description: "Accept with required revisions",
    icon: <AlertTriangle className="h-6 w-6" />,
    className: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600",
  },
  {
    value: "reject",
    label: "Reject",
    description: "Reject submission",
    icon: <XCircle className="h-6 w-6" />,
    className: "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600",
  },
];

function DecisionSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DecisionPanel({
  paperId,
  paperTitle,
  conferenceId,
  decision,
  reviewStats,
  decidedBy,
  canMakeDecision,
  loading = false,
  onUpdate,
}: DecisionPanelProps) {
  const { addToast, ToastRenderer } = useSimpleToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<DecisionType | "">(
    (decision?.finalDecision?.toLowerCase() as DecisionType) ||
      (decision?.decision?.toLowerCase() as DecisionType) ||
      ""
  );
  const [comment, setComment] = useState(decision?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state when opened
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setSelectedDecision(
          (decision?.finalDecision?.toLowerCase() as DecisionType) ||
            (decision?.decision?.toLowerCase() as DecisionType) ||
            ""
        );
        setComment(decision?.comment || "");
        setError(null);
      }
      setModalOpen(open);
    },
    [decision]
  );

  // Submit decision
  const handleSubmit = async () => {
    if (!selectedDecision) return;

    setSubmitting(true);
    setError(null);

    try {
      await decisionApi.makeDecision(paperId, {
        finalDecision: selectedDecision,
        comment: comment.trim() || undefined,
      });

      addToast({
        type: "success",
        title: "Decision Submitted",
        description: `Paper has been marked as ${selectedDecision.replace("_", " ")}.`,
      });

      setModalOpen(false);
      onUpdate();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to submit decision";
      setError(message);
      addToast({
        type: "error",
        title: "Error",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <DecisionSkeleton />;
  }

  return (
    <div className="space-y-6">
      <ToastRenderer />

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Paper Decision
                </CardTitle>
                <CardDescription className="mt-1">
                  {canMakeDecision
                    ? "Review submissions and make a final decision"
                    : "View the decision status for this paper"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {decision && (
                  <Badge
                    variant="outline"
                    className={
                      decision.finalDecision?.toLowerCase().includes("accept")
                        ? decision.finalDecision?.toLowerCase() === "conditional_accept"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {decision.finalDecision?.toLowerCase() === "conditional_accept"
                      ? "Conditionally Accepted"
                      : decision.finalDecision?.toLowerCase() === "accept"
                      ? "Accepted"
                      : "Rejected"}
                  </Badge>
                )}
                {canMakeDecision && (
                  <Button size="sm" onClick={() => handleOpenChange(true)}>
                    <Gavel className="h-4 w-4 mr-2" />
                    {decision ? "Update" : "Decide"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Review Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Review Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Average Score */}
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Score</p>
                  <p className="text-2xl font-bold">
                    {reviewStats.averageScore > 0
                      ? reviewStats.averageScore.toFixed(1)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Average Confidence */}
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Confidence</p>
                  <p className="text-2xl font-bold">
                    {reviewStats.averageConfidence > 0
                      ? reviewStats.averageConfidence.toFixed(1)
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Completed Reviews */}
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{reviewStats.completedReviewCount}</p>
                </div>
              </div>

              {/* Pending Reviews */}
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{reviewStats.pendingReviewCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Decision Summary (if exists) */}
      {decision && (
        <DecisionSummary decision={decision} decidedBy={decidedBy} />
      )}

      {/* No Decision State */}
      {!decision && canMakeDecision && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.2 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Scale className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">No Decision Yet</h3>
              <p className="mt-2 max-w-sm text-center text-muted-foreground">
                {reviewStats.completedReviewCount === 0
                  ? "Waiting for reviews to be submitted before making a decision."
                  : `${reviewStats.completedReviewCount} review(s) submitted. Ready to make a decision.`}
              </p>
              {reviewStats.completedReviewCount === 0 && (
                <Alert className="mt-6 max-w-md border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                    Consider waiting for reviewer feedback before making a decision.
                  </AlertDescription>
                </Alert>
              )}
              <Button className="mt-6" onClick={() => handleOpenChange(true)}>
                <Gavel className="mr-2 h-4 w-4" />
                Make Decision
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reviewer Scores */}
      {reviewStats.scores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Reviewer Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviewStats.scores.map((score) => (
                  <div
                    key={score.reviewerId}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 ${
                      score.submittedAt ? "" : "opacity-60 border-dashed bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {score.reviewerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{score.reviewerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {score.submittedAt ? "Review submitted" : "Review pending"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {score.score !== null ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{score.score}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold">{score.confidence}</span>
                          </div>
                          {score.recommendation && (
                            <Badge
                              variant="outline"
                              className={
                                score.recommendation.toLowerCase().includes("accept")
                                  ? "bg-green-50 text-green-700"
                                  : score.recommendation.toLowerCase().includes("reject")
                                  ? "bg-red-50 text-red-700"
                                  : "bg-yellow-50 text-yellow-700"
                              }
                            >
                              {score.recommendation}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Make Decision Modal */}
      <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              {decision ? "Update Paper Decision" : "Make Paper Decision"}
            </DialogTitle>
            <DialogDescription>
              Review &ldquo;{paperTitle}&rdquo; and provide your final decision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
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
              <div className="grid gap-3">
                {decisionOptions.map((option) => {
                  const isSelected = selectedDecision === option.value;

                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedDecision(option.value)}
                      disabled={submitting}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all disabled:opacity-50 ${
                        isSelected
                          ? option.className
                          : "border-muted hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          option.value === "accept"
                            ? "bg-green-100 dark:bg-green-900/50"
                            : option.value === "conditional_accept"
                            ? "bg-yellow-100 dark:bg-yellow-900/50"
                            : "bg-red-100 dark:bg-red-900/50"
                        }`}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">
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
                Comments to Author{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add comments about your decision..."
                rows={4}
                className="resize-none"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                These comments will be visible to the authors.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedDecision || submitting}
              className={
                selectedDecision === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : selectedDecision === "conditional_accept"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : selectedDecision === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {selectedDecision === "accept" ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  ) : selectedDecision === "conditional_accept" ? (
                    <AlertTriangle className="mr-2 h-4 w-4" />
                  ) : selectedDecision === "reject" ? (
                    <XCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <Gavel className="mr-2 h-4 w-4" />
                  )}
                  {decision ? "Update Decision" : "Submit Decision"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

