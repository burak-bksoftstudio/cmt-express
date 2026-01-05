
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  MessageSquare,
  Clock,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface DecisionEvent {
  id: string;
  type: "decision" | "update" | "comment";
  decision?: string;
  comment?: string;
  timestamp: string;
  decidedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface DecisionHistoryProps {
  paperId: string;
  events?: DecisionEvent[];
  loading?: boolean;
}

const decisionIcons: Record<string, React.ReactNode> = {
  accept: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  accepted: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  conditional_accept: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  reject: <XCircle className="h-4 w-4 text-red-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
};

const decisionLabels: Record<string, string> = {
  accept: "Accept",
  accepted: "Accepted",
  conditional_accept: "Conditional Accept",
  reject: "Reject",
  rejected: "Rejected",
};

function HistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DecisionHistory({
  paperId,
  events = [],
  loading = false,
}: DecisionHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  // Show only first 3 events when collapsed
  const visibleEvents = expanded ? events : events.slice(0, 3);
  const hasMore = events.length > 3;

  if (loading) {
    return <HistorySkeleton />;
  }

  if (events.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <History className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No Decision History</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            The decision history will appear here once a decision has been made.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Decision History
        </CardTitle>
        <CardDescription>
          Timeline of all decision-related activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {visibleEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{
                    duration: 0.3,
                    ease: appleEasing,
                    delay: index * 0.05,
                  }}
                  className="relative flex items-start gap-4 pl-10"
                >
                  {/* Timeline Dot */}
                  <div
                    className={`absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${
                      event.type === "decision"
                        ? "bg-purple-100 dark:bg-purple-900/50"
                        : event.type === "update"
                        ? "bg-blue-100 dark:bg-blue-900/50"
                        : "bg-muted"
                    }`}
                  >
                    {event.decision ? (
                      decisionIcons[event.decision.toLowerCase()] || (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )
                    ) : event.type === "comment" ? (
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {event.decision && (
                          <Badge
                            variant="outline"
                            className={
                              event.decision.toLowerCase().includes("accept")
                                ? event.decision.toLowerCase() === "conditional_accept"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {decisionLabels[event.decision.toLowerCase()] || event.decision}
                          </Badge>
                        )}
                        {event.type === "comment" && (
                          <span className="text-sm font-medium">Comment added</span>
                        )}
                        {event.type === "update" && !event.decision && (
                          <span className="text-sm font-medium">Decision updated</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>

                    {/* Decided By */}
                    {event.decidedBy && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          {event.decidedBy.firstName} {event.decidedBy.lastName}
                        </span>
                      </div>
                    )}

                    {/* Comment */}
                    {event.comment && (
                      <div className="mt-2 rounded-lg bg-muted/50 p-3">
                        <p className="text-sm whitespace-pre-wrap line-clamp-3">
                          {event.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Show More Button */}
          {hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex justify-center"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="gap-2"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {events.length - 3} More
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

