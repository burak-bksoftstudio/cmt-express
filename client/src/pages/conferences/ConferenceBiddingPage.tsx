import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { biddingApi, BidValue } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Target,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  BarChart3,
  Users,
  FileText,
} from "lucide-react";

interface ReviewerStats {
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  totalBids: number;
  yesBids: number;
  maybeBids: number;
  noBids: number;
  conflictBids: number;
}

interface PaperBidData {
  paper: {
    id: string;
    title: string;
    track?: string;
  };
  bids: {
    reviewerId: string;
    reviewerName: string;
    bid: BidValue;
  }[];
}

interface BiddingMatrixData {
  matrix: PaperBidData[];
  reviewers: ReviewerStats[];
  summary: {
    totalPapers: number;
    totalReviewers: number;
    papersWithBids: number;
    papersWithoutBids: number;
  };
}

const bidCellConfig: Record<BidValue, { bg: string; text: string; icon: React.ElementType }> = {
  YES: {
    bg: "bg-green-500 hover:bg-green-600",
    text: "text-white",
    icon: ThumbsUp,
  },
  MAYBE: {
    bg: "bg-yellow-400 hover:bg-yellow-500",
    text: "text-black",
    icon: HelpCircle,
  },
  NO: {
    bg: "bg-gray-400 hover:bg-gray-500",
    text: "text-white",
    icon: ThumbsDown,
  },
  CONFLICT: {
    bg: "bg-red-500 hover:bg-red-600",
    text: "text-white",
    icon: AlertTriangle,
  },
};

export default function ConferenceBiddingPage() {
  const params = useParams();
  const conferenceId = params.id as string;

  const [data, setData] = useState<BiddingMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMatrix = async () => {
    try {
      const response = await biddingApi.getConferenceBiddingMatrix(conferenceId);
      setData(response.data?.data);
    } catch (error) {
      console.error("Failed to fetch bidding matrix:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (conferenceId) {
      fetchMatrix();
    }
  }, [conferenceId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMatrix();
  };

  // Filter papers and reviewers by search
  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    const filteredMatrix = data.matrix.filter(
      (p) =>
        p.paper.title.toLowerCase().includes(query) ||
        p.paper.track?.toLowerCase().includes(query)
    );

    return {
      ...data,
      matrix: filteredMatrix,
    };
  }, [data, searchQuery]);

  // Get all unique reviewers for column headers
  const reviewerColumns = useMemo(() => {
    if (!data) return [];
    return data.reviewers.map((r) => ({
      id: r.reviewer.id,
      name: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
      email: r.reviewer.email,
      stats: r,
    }));
  }, [data]);

  // Get bid for a specific paper/reviewer
  const getBid = (paperBids: PaperBidData["bids"], reviewerId: string): BidValue | null => {
    const bid = paperBids.find((b) => b.reviewerId === reviewerId);
    return bid?.bid || null;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Link to={`/conferences/${conferenceId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Target className="h-6 w-6" />
                Bidding Matrix
              </h1>
              <p className="text-muted-foreground">
                Overview of reviewer bids on papers
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </motion.div>

        {/* Summary Stats */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-4 md:grid-cols-4"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalPapers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Reviewers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalReviewers}</div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Papers With Bids</CardTitle>
                <ThumbsUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.summary.papersWithBids}</div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Papers Without Bids</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{data.summary.papersWithoutBids}</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {(["YES", "MAYBE", "NO", "CONFLICT"] as BidValue[]).map((bid) => {
                  const config = bidCellConfig[bid];
                  const Icon = config.icon;
                  return (
                    <div key={bid} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded",
                          config.bg,
                          config.text
                        )}
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-sm">{bid}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-muted border border-dashed">
                    <span className="text-xs text-muted-foreground">—</span>
                  </div>
                  <span className="text-sm">No Bid</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Matrix Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Bidding Matrix
              </CardTitle>
              <CardDescription>
                Overview of all bids
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[600px]">
                <TooltipProvider>
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-background">
                      <tr>
                        <th className="sticky left-0 z-20 bg-background border-b border-r p-3 text-left text-sm font-medium min-w-[250px]">
                          Paper
                        </th>
                        {reviewerColumns.map((reviewer) => (
                          <th
                            key={reviewer.id}
                            className="border-b p-2 text-center text-xs font-medium min-w-[80px] max-w-[100px]"
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-help truncate">
                                  {reviewer.name.split(" ")[0]}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <div className="text-sm">
                                  <p className="font-medium">{reviewer.name}</p>
                                  <p className="text-muted-foreground">{reviewer.email}</p>
                                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                    <span className="text-green-500">Yes: {reviewer.stats.yesBids}</span>
                                    <span className="text-yellow-500">Maybe: {reviewer.stats.maybeBids}</span>
                                    <span className="text-gray-500">No: {reviewer.stats.noBids}</span>
                                    <span className="text-red-500">COI: {reviewer.stats.conflictBids}</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData?.matrix.map((paper, rowIndex) => (
                        <tr
                          key={paper.paper.id}
                          className={cn(
                            "group hover:bg-accent/50 transition-colors",
                            rowIndex % 2 === 0 && "bg-muted/30"
                          )}
                        >
                          <td className="sticky left-0 z-10 bg-inherit border-r p-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-[230px]">
                                  <p className="text-sm font-medium truncate cursor-help">
                                    {paper.paper.title}
                                  </p>
                                  {paper.paper.track && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {paper.paper.track}
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[300px]">
                                <p className="font-medium">{paper.paper.title}</p>
                                {paper.paper.track && (
                                  <p className="text-muted-foreground">Track: {paper.paper.track}</p>
                                )}
                                <p className="mt-1 text-xs">
                                  {paper.bids.length} bids
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          {reviewerColumns.map((reviewer) => {
                            const bid = getBid(paper.bids, reviewer.id);
                            const config = bid ? bidCellConfig[bid] : null;

                            return (
                              <td key={reviewer.id} className="p-1 text-center">
                                {bid && config ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className={cn(
                                          "mx-auto flex h-8 w-8 items-center justify-center rounded cursor-pointer transition-colors",
                                          config.bg,
                                          config.text
                                        )}
                                      >
                                        <config.icon className="h-4 w-4" />
                                      </motion.div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {reviewer.name}: <strong>{bid}</strong>
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded border border-dashed bg-muted/50 text-muted-foreground">
                                    <span className="text-xs">—</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TooltipProvider>
              </div>

              {/* Empty State */}
              {filteredData?.matrix.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No Papers Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "No papers in this conference"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Reviewer Statistics */}
        {data && data.reviewers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Reviewer Statistics
                </CardTitle>
                <CardDescription>
                  Bidding activity per reviewer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.reviewers.map((reviewer, index) => (
                    <motion.div
                      key={reviewer.reviewer.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {reviewer.reviewer.firstName} {reviewer.reviewer.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reviewer.reviewer.email}
                          </p>
                        </div>
                        <Badge variant="secondary">{reviewer.totalBids} bids</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="rounded bg-green-100 dark:bg-green-900/30 p-1">
                          <p className="font-bold text-green-600">{reviewer.yesBids}</p>
                          <p className="text-green-600/80">Yes</p>
                        </div>
                        <div className="rounded bg-yellow-100 dark:bg-yellow-900/30 p-1">
                          <p className="font-bold text-yellow-600">{reviewer.maybeBids}</p>
                          <p className="text-yellow-600/80">Maybe</p>
                        </div>
                        <div className="rounded bg-gray-100 dark:bg-gray-800 p-1">
                          <p className="font-bold text-gray-600">{reviewer.noBids}</p>
                          <p className="text-gray-600/80">No</p>
                        </div>
                        <div className="rounded bg-red-100 dark:bg-red-900/30 p-1">
                          <p className="font-bold text-red-600">{reviewer.conflictBids}</p>
                          <p className="text-red-600/80">COI</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
