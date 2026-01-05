
import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BiddingButtons } from "@/components/bidding";
import { useSimpleToast } from "@/components/ui/toast";
import { biddingApi, BidValue } from "@/lib/api";
import { PaperBid, User } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Target,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  ExternalLink,
} from "lucide-react";

interface BiddingSectionProps {
  paperId: string;
  conferenceId?: string;
  userBid?: PaperBid | null;
  allBids?: (PaperBid & { user?: Partial<User> })[];
  isReviewer: boolean;
  isAuthor: boolean;
  canManage: boolean;
  loading?: boolean;
  onBidChange?: () => void;
}

// Loading skeleton for the section
function BiddingSkeletons() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Bid config for display
const bidDisplayConfig: Record<
  BidValue,
  { label: string; icon: React.ElementType; bgColor: string; textColor: string }
> = {
  YES: {
    label: "Yes",
    icon: ThumbsUp,
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-600 dark:text-green-400",
  },
  MAYBE: {
    label: "Maybe",
    icon: HelpCircle,
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-600 dark:text-yellow-400",
  },
  NO: {
    label: "No",
    icon: ThumbsDown,
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-600 dark:text-gray-400",
  },
  CONFLICT: {
    label: "Conflict",
    icon: AlertTriangle,
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-600 dark:text-red-400",
  },
};

export function BiddingSection({
  paperId,
  conferenceId,
  userBid,
  allBids = [],
  isReviewer,
  isAuthor,
  canManage,
  loading = false,
  onBidChange,
}: BiddingSectionProps) {
  const [currentBid, setCurrentBid] = useState<BidValue | null>(null);
  const [fetchingBid, setFetchingBid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { addToast, ToastRenderer } = useSimpleToast();

  // Reviewers (not authors) can bid
  const canBid = isReviewer && !isAuthor;

  // Fetch current bid on mount
  useEffect(() => {
    const fetchCurrentBid = async () => {
      if (!canBid) return;
      setFetchingBid(true);
      try {
        const response = await biddingApi.getBidForPaper(paperId);
        const bid = response.data?.data?.bid;
        if (bid) {
          setCurrentBid(bid);
        }
      } catch (error) {
        // No bid yet is okay
        console.log("No existing bid found");
      } finally {
        setFetchingBid(false);
      }
    };

    fetchCurrentBid();
  }, [paperId, canBid]);

  // Calculate bid statistics for admin/chair view
  const bidStats = useMemo(() => {
    if (!allBids || allBids.length === 0) return null;

    // Support both old (level) and new (bid) formats
    const getBidValue = (b: any) => b.bid || b.level;

    const stats = {
      total: allBids.length,
      yes: allBids.filter((b) => getBidValue(b) === "YES" || getBidValue(b) === "high").length,
      maybe: allBids.filter((b) => getBidValue(b) === "MAYBE" || getBidValue(b) === "medium").length,
      no: allBids.filter((b) => getBidValue(b) === "NO" || getBidValue(b) === "low").length,
      conflict: allBids.filter((b) => getBidValue(b) === "CONFLICT" || getBidValue(b) === "no_bid").length,
    };

    return stats;
  }, [allBids]);

  // Handle bid change
  const handleBidChange = useCallback(
    (bid: BidValue) => {
      setCurrentBid(bid);
      setSuccess("Bid submitted successfully!");
      setError(null);
      onBidChange?.();
    },
    [onBidChange]
  );

  // Handle refresh
  const handleRefresh = () => {
    setError(null);
    setSuccess(null);
    onBidChange?.();
  };

  // Loading state
  if (loading) {
    return <BiddingSkeletons />;
  }

  // Authors don't see bidding section
  if (isAuthor && !canManage) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Toast Renderer */}
      <ToastRenderer />

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Paper Bidding
              </CardTitle>
              <CardDescription>
                {canBid
                  ? "Indicate your interest level in reviewing this paper"
                  : canManage
                  ? "View all reviewer bids for this paper"
                  : "Bidding information for this paper"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {canManage && bidStats && (
                <Badge variant="secondary" className="font-normal">
                  {bidStats.total} {bidStats.total === 1 ? "bid" : "bids"}
                </Badge>
              )}
              {canManage && conferenceId && (
                <Link to={`/conferences/${conferenceId}/bidding`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bidding Matrix
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Statistics for Admin/Chair */}
        {canManage && bidStats && bidStats.total > 0 && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(["YES", "MAYBE", "NO", "CONFLICT"] as BidValue[]).map((bidValue) => {
                  const config = bidDisplayConfig[bidValue];
                  const Icon = config.icon;
                  const count =
                    bidValue === "YES"
                      ? bidStats.yes
                      : bidValue === "MAYBE"
                      ? bidStats.maybe
                      : bidValue === "NO"
                      ? bidStats.no
                      : bidStats.conflict;

                  return (
                    <motion.div
                      key={bidValue}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 ${config.textColor}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{config.label}</p>
                        <p className="text-xl font-bold">{count}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-green-700 dark:text-green-300">
            <span>{success}</span>
            <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Reviewer Bidding Section */}
      {canBid && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Bid</CardTitle>
            <CardDescription>
              Select your interest level for reviewing this paper
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fetchingBid ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-24" />
                ))}
              </div>
            ) : (
              <BiddingButtons
                paperId={paperId}
                currentBid={currentBid}
                onBidChange={handleBidChange}
              />
            )}
            {currentBid && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Badge variant="outline" className={bidDisplayConfig[currentBid].textColor}>
                  Current bid: {bidDisplayConfig[currentBid].label}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin/Chair View - All Bids */}
      {canManage && allBids.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">All Reviewer Bids</CardTitle>
                <CardDescription>
                  Bids from all reviewers for this paper
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allBids.map((bid, index) => {
                const bidValue = (bid as any).bid || (bid as any).level;
                const config = bidDisplayConfig[bidValue as BidValue] || bidDisplayConfig.NO;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={bid.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${config.bgColor}`}
                      >
                        <Icon className={`h-4 w-4 ${config.textColor}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {bid.user
                            ? `${bid.user.firstName} ${bid.user.lastName}`
                            : "Anonymous"}
                        </p>
                        {bid.user?.email && (
                          <p className="text-xs text-muted-foreground">{bid.user.email}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={config.textColor}>
                      {config.label}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State for Admin/Chair with no bids */}
      {canManage && allBids.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Target className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-6 text-lg font-semibold">No bids yet</h3>
            <p className="mt-2 max-w-sm text-center text-muted-foreground">
              Reviewers haven&#39;t submitted any bids for this paper yet. Bids will appear
              here once reviewers indicate their interest levels.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Access State */}
      {!canBid && !canManage && !isAuthor && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">Bidding not available</h3>
            <p className="mt-1 text-xs text-muted-foreground text-center max-w-sm">
              You don&#39;t have permission to view or submit bids for this paper.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
