
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  Star,
  Shield,
  MessageSquare,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

export type DecisionType = "accept" | "reject" | "conditional_accept";

interface DecisionSummaryProps {
  decision: {
    id: string;
    paperId: string;
    decision: string;
    finalDecision: string | null;
    comment: string | null;
    averageScore: number | null;
    averageConfidence: number | null;
    reviewCount: number | null;
    decidedAt: string;
  };
  decidedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

// Decision configuration with CONDITIONAL_ACCEPT
const decisionConfig: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
    bgClassName: string;
    description: string;
  }
> = {
  accept: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-5 w-5" />,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    bgClassName:
      "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
    description: "Paper has been accepted for publication",
  },
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-5 w-5" />,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    bgClassName:
      "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
    description: "Paper has been accepted for publication",
  },
  conditional_accept: {
    label: "Conditionally Accepted",
    icon: <AlertTriangle className="h-5 w-5" />,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    bgClassName:
      "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800",
    description: "Paper accepted pending minor revisions",
  },
  reject: {
    label: "Rejected",
    icon: <XCircle className="h-5 w-5" />,
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    bgClassName:
      "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
    description: "Paper has been rejected",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-5 w-5" />,
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    bgClassName:
      "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
    description: "Paper has been rejected",
  },
};

export function DecisionSummary({ decision, decidedBy }: DecisionSummaryProps) {
  const displayDecision = decision?.finalDecision || decision?.decision;
  const config = displayDecision
    ? decisionConfig[displayDecision.toLowerCase()] || decisionConfig.reject
    : null;

  if (!config) return null;

  const isAccepted = displayDecision?.toLowerCase().includes("accept");
  const isConditional = displayDecision?.toLowerCase() === "conditional_accept";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: appleEasing }}
      className="space-y-4"
    >
      {/* Main Decision Card */}
      <Card className={`border-2 ${config.bgClassName}`}>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  isAccepted && !isConditional
                    ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                    : isConditional
                    ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                }`}
              >
                {isAccepted && !isConditional ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : isConditional ? (
                  <AlertTriangle className="h-8 w-8" />
                ) : (
                  <XCircle className="h-8 w-8" />
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
              className={`text-base px-4 py-2 ${config.className}`}
            >
              {config.icon}
              <span className="ml-2">{config.label}</span>
            </Badge>
          </div>
        </CardHeader>

        {/* Decision Info */}
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-muted-foreground">{config.description}</p>

          {/* Stats Row */}
          {(decision.averageScore || decision.averageConfidence) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {decision.averageScore && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>
                    Avg. Score:{" "}
                    <strong>{decision.averageScore.toFixed(1)}</strong>
                  </span>
                </div>
              )}
              {decision.averageConfidence && (
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>
                    Avg. Confidence:{" "}
                    <strong>{decision.averageConfidence.toFixed(1)}</strong>
                  </span>
                </div>
              )}
              {decision.reviewCount && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  Based on {decision.reviewCount} review(s)
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment Card */}
      {decision.comment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: appleEasing, delay: 0.1 }}
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

      {/* Decided By Card */}
      {decidedBy && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: appleEasing, delay: 0.2 }}
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
    </motion.div>
  );
}

