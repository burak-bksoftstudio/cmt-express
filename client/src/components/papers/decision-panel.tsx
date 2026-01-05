import { t } from "@/lib/i18n";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import {
  Star,
  Shield,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  User,
  Clock,
  AlertCircle,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

// Types matching backend response
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

interface DecidedBy {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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

interface DecisionPanelProps {
  decision: DecisionData | null;
  reviewStats: ReviewStats;
  decidedBy: DecidedBy | null;
}

// Decision configuration
const decisionConfig: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
    bgClassName: string;
  }
> = {
  accept: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-4 w-4" />,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    bgClassName:
      "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
  },
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-4 w-4" />,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    bgClassName:
      "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
  },
  reject: {
    label: "Rejected",
    icon: <XCircle className="h-4 w-4" />,
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    bgClassName:
      "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-4 w-4" />,
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    bgClassName:
      "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
  },
};

export function DecisionPanel({
  decision,
  reviewStats,
  decidedBy,
}: DecisionPanelProps) {
  // Get the display decision value
  const displayDecision = decision?.finalDecision || decision?.decision;
  const config = displayDecision
    ? decisionConfig[displayDecision.toLowerCase()] || decisionConfig.accept
    : null;

  const isAccepted = displayDecision?.toLowerCase().includes("accept");

  return (
    <div className="space-y-6">
      {/* Decision Summary Card */}
      {decision && config && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing }}
        >
          <Card className={`border-2 ${config.bgClassName}`}>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full ${
                      isAccepted
                        ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                    }`}
                  >
                    {isAccepted ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : (
                      <XCircle className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl">Final Decision</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(decision.decidedAt)}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-base px-4 py-1.5 ${config.className}`}
                >
                  {config.icon}
                  <span className="ml-2">{config.label}</span>
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      )}

      {/* Statistics Cards */}
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
                  <p className="text-2xl font-bold">
                    {reviewStats.completedReviewCount}
                  </p>
                </div>
              </div>

              {/* Pending Reviews */}
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {reviewStats.pendingReviewCount}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Individual Review Scores */}
      {reviewStats.scores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.2 }}
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
                {reviewStats.scores.map((score, index) => (
                  <div
                    key={score.reviewerId}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 ${
                      score.submittedAt
                        ? ""
                        : "opacity-60 border-dashed bg-muted/30"
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
                          {score.submittedAt
                            ? `Submitted ${formatDateTime(score.submittedAt)}`
                            : "Review pending"}
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
                            <span className="font-semibold">
                              {score.confidence}
                            </span>
                          </div>
                          {score.recommendation && (
                            <Badge
                              variant="outline"
                              className={
                                score.recommendation.toLowerCase().includes("accept")
                                  ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                  : score.recommendation.toLowerCase().includes("reject")
                                  ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                  : "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
                              }
                            >
                              {score.recommendation}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <AlertCircle className="h-3 w-3 mr-1" />
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

      {/* Decision Comment */}
      {decision?.comment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Decision Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {decision.comment}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Decided By */}
      {decidedBy && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.4 }}
        >
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Decision made by</p>
                    <p className="font-medium">
                      {decidedBy.firstName} {decidedBy.lastName}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">{decidedBy.email}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
