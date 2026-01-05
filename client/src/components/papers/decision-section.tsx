
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DecisionPanel } from "./decision-panel";
import { MakeDecisionModal } from "./make-decision-modal";
import { decisionApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDateTime } from "@/lib/utils";
import {
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Gavel,
  FileText,
  MessageSquare,
  Users,
  Calendar,
  Send,
  CheckCheck,
  Camera,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

// ============================================================================
// TYPES
// ============================================================================

type PaperStage = "submitted" | "under_review" | "decided" | "camera_ready";

interface TimelineEvent {
  type: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, unknown>;
}

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

interface PaperData {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  conference: {
    id: string;
    name: string;
  };
}

interface DecisionInfo {
  paper: PaperData;
  decision: DecisionData | null;
  stage: PaperStage;
  timeline: TimelineEvent[];
  reviewStats: ReviewStats;
  decidedBy: DecidedBy | null;
  hasDecision: boolean;
}

interface DecisionSectionProps {
  paperId: string;
  conferenceId: string;
}

// ============================================================================
// STAGE CONFIGURATION
// ============================================================================

const stageConfig: Record<
  PaperStage,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
    description: string;
  }
> = {
  submitted: {
    label: "Submitted",
    icon: <Send className="h-3.5 w-3.5" />,
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    description: "Paper has been submitted and is awaiting review",
  },
  under_review: {
    label: "Under Review",
    icon: <Users className="h-3.5 w-3.5" />,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    description: "Reviews are in progress",
  },
  decided: {
    label: "Decided",
    icon: <CheckCheck className="h-3.5 w-3.5" />,
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    description: "Final decision has been made",
  },
  camera_ready: {
    label: "Camera Ready",
    icon: <Camera className="h-3.5 w-3.5" />,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    description: "Camera-ready version has been approved",
  },
};

// ============================================================================
// TIMELINE ICON HELPER
// ============================================================================

const getTimelineIcon = (type: string) => {
  switch (type) {
    case "submitted":
      return <Send className="h-4 w-4" />;
    case "file_uploaded":
      return <FileText className="h-4 w-4" />;
    case "review_submitted":
      return <MessageSquare className="h-4 w-4" />;
    case "decision":
      return <Gavel className="h-4 w-4" />;
    case "camera_ready_uploaded":
      return <Camera className="h-4 w-4" />;
    case "camera_ready_approved":
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

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
            <Skeleton className="h-8 w-28 rounded-full" />
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
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DecisionSection({ paperId, conferenceId }: DecisionSectionProps) {
  const { permissions, isChairOfConference } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DecisionInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check if user can make decisions
  const canMakeDecision =
    permissions.isAdmin || isChairOfConference(conferenceId);

  // Fetch decision info
  const fetchDecisionInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await decisionApi.getInfo(paperId);
      setData(response.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      if (error.response?.status === 404) {
        setError("Decision info not found");
      } else {
        setError(error.response?.data?.message || "Failed to load decision info");
      }
    } finally {
      setLoading(false);
    }
  }, [paperId]);

  // Initial fetch
  useEffect(() => {
    fetchDecisionInfo();
  }, [fetchDecisionInfo, refreshKey]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Handle decision made
  const handleDecisionMade = () => {
    handleRefresh();
  };

  // Get stage config
  const stageInfo = data?.stage ? stageConfig[data.stage] : stageConfig.submitted;

  // Get decision value for modal
  const existingDecisionValue = data?.decision?.finalDecision || data?.decision?.decision;
  const existingDecision = existingDecisionValue
    ? (existingDecisionValue.toLowerCase().includes("accept") ? "accept" : "reject") as "accept" | "reject"
    : null;

  // Loading state
  if (loading) {
    return <DecisionSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing }}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Decision</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
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
                <Badge variant="outline" className={stageInfo.className}>
                  {stageInfo.icon}
                  <span className="ml-1.5">{stageInfo.label}</span>
                </Badge>
                {canMakeDecision && (
                  <Button size="sm" onClick={() => setModalOpen(true)}>
                    <Gavel className="h-4 w-4 mr-2" />
                    {data.hasDecision ? "Update" : "Decide"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Decision Panel (if exists) or Stats Summary */}
      {data.hasDecision && data.decision ? (
        <DecisionPanel
          decision={data.decision}
          reviewStats={data.reviewStats}
          decidedBy={data.decidedBy}
        />
      ) : (
        <>
          {/* No Decision - Show Review Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: appleEasing, delay: 0.1 }}
          >
            {data.reviewStats.completedReviewCount > 0 ? (
              <DecisionPanel
                decision={null}
                reviewStats={data.reviewStats}
                decidedBy={null}
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Scale className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">
                    {canMakeDecision ? "No Decision Yet" : "Decision Pending"}
                  </h3>
                  <p className="mt-2 max-w-sm text-center text-muted-foreground">
                    {data.reviewStats.reviewCount === 0
                      ? "No reviewers have been assigned to this paper yet."
                      : `${data.reviewStats.pendingReviewCount} of ${data.reviewStats.reviewCount} reviews pending.`}
                  </p>
                  {canMakeDecision && data.reviewStats.completedReviewCount === 0 && (
                    <Alert className="mt-6 max-w-md border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                        Consider waiting for reviewer feedback before making a decision.
                      </AlertDescription>
                    </Alert>
                  )}
                  {canMakeDecision && (
                    <Button className="mt-6" onClick={() => setModalOpen(true)}>
                      <Gavel className="mr-2 h-4 w-4" />
                      Make Decision
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </>
      )}

      {/* Timeline */}
      {data.timeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-4">
                  {data.timeline.map((event, index) => (
                    <motion.div
                      key={`${event.type}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: appleEasing,
                        delay: index * 0.05,
                      }}
                      className="relative flex items-start gap-4 pl-10"
                    >
                      {/* Dot */}
                      <div
                        className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${
                          event.type === "decision"
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
                            : event.type === "review_submitted"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                            : event.type.includes("camera_ready")
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getTimelineIcon(event.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium">{event.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(event.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info Card for non-decision makers */}
      {!canMakeDecision && !data.hasDecision && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.3 }}
        >
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  The decision for this paper is pending. You will be notified once a
                  decision has been made by the program committee.
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Make Decision Modal */}
      <MakeDecisionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        paperId={paperId}
        paperTitle={data.paper.title}
        existingDecision={existingDecision}
        existingComment={data.decision?.comment || undefined}
        onSuccess={handleDecisionMade}
      />
    </div>
  );
}
