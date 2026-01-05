

import { useEffect, useState, useMemo } from "react";
import { t } from "@/lib/i18n";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { biddingApi, BidValue } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Target,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

interface BidData {
  id: string;
  paperId: string;
  reviewerId: string;
  bid: BidValue;
  paper: {
    id: string;
    title: string;
    conference?: {
      id: string;
      name: string;
    };
  };
}

const bidConfig: Record<
  BidValue,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  YES: {
    label: "",
    icon: ThumbsUp,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  MAYBE: {
    label: "",
    icon: HelpCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  NO: {
    label: "",
    icon: ThumbsDown,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  CONFLICT: {
    label: "",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

interface BiddingSummaryProps {
  conferenceId?: string;
}

export function BiddingSummary({ conferenceId }: BiddingSummaryProps) {
  // translations removed
  const [bids, setBids] = useState<BidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPapers, setTotalPapers] = useState(0);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        const response = await biddingApi.getMyBids();
        const allBids = response.data?.data || [];
        
        // Filter by conference if provided
        const filteredBids = conferenceId
          ? allBids.filter((b: BidData) => b.paper?.conference?.id === conferenceId)
          : allBids;
        
        setBids(filteredBids);

        // Get total papers for bidding if conferenceId provided
        if (conferenceId) {
          try {
            const papersResponse = await biddingApi.getPapersForBidding(conferenceId);
            const papers = papersResponse.data?.data || [];
            setTotalPapers(papers.length);
          } catch {
            // Ignore errors
          }
        }
      } catch (error) {
        console.error("Failed to fetch bids:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [conferenceId]);

  // Calculate statistics
  const stats = useMemo(() => {
    const yes = bids.filter((b) => b.bid === "YES").length;
    const maybe = bids.filter((b) => b.bid === "MAYBE").length;
    const no = bids.filter((b) => b.bid === "NO").length;
    const conflict = bids.filter((b) => b.bid === "CONFLICT").length;
    const total = bids.length;
    const missing = totalPapers > 0 ? totalPapers - total : 0;
    const completionPercent = totalPapers > 0 ? Math.round((total / totalPapers) * 100) : 0;

    return { yes, maybe, no, conflict, total, missing, completionPercent };
  }, [bids, totalPapers]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                {t("title")}
              </CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            {stats.total > 0 && (
              <Badge variant="secondary">{t("badge", { count: stats.total })}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar (if we know total papers) */}
          {totalPapers > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("progress.title")}</span>
                <span className="font-medium">{stats.completionPercent}%</span>
              </div>
              <Progress value={stats.completionPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {t("progress.count", { total: totalPapers, completed: stats.total })}
                {stats.missing > 0 && (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {" "}
                    ({t("progress.remaining", { count: stats.missing })})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Bid Statistics Grid */}
          <div className="grid grid-cols-4 gap-3">
            {(["YES", "MAYBE", "NO", "CONFLICT"] as BidValue[]).map((bidValue) => {
              const config = {
                ...bidConfig[bidValue],
                label: t(`labels.${bidValue.toLowerCase()}`),
              };
              const Icon = config.icon;
              const count =
                bidValue === "YES"
                  ? stats.yes
                  : bidValue === "MAYBE"
                  ? stats.maybe
                  : bidValue === "NO"
                  ? stats.no
                  : stats.conflict;

              return (
                <motion.div
                  key={bidValue}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "rounded-lg p-3 text-center transition-colors",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("h-5 w-5 mx-auto mb-1", config.color)} />
                  <p className={cn("text-xl font-bold", config.color)}>{count}</p>
                  <p className={cn("text-xs", config.color)}>{config.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* All Complete Message */}
          {totalPapers > 0 && stats.missing === 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <CheckCircle className="h-4 w-4" />
              <span>{t("allDone")}</span>
            </div>
          )}

          {/* Missing Bids Warning */}
          {stats.missing > 0 && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4" />
              <span>{t("missing", { count: stats.missing })}</span>
            </div>
          )}

          {/* Continue Bidding Button */}
          {conferenceId && stats.missing > 0 && (
            <Link to={`/conferences/${conferenceId}/bidding`}>
              <Button className="w-full gap-2">
                {t("continue")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {/* Empty State */}
          {stats.total === 0 && (
            <div className="text-center py-4">
              <Target className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {t("empty")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

