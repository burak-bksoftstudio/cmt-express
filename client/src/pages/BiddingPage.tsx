import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { biddingApi, conferenceApi, BidValue } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth-store";
import {
  Target,
  Search,
  FileText,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaperForBidding {
  id: string;
  title: string;
  abstract?: string;
  track?: {
    id: string;
    name: string;
  };
  currentBid?: BidValue;
}

interface Conference {
  id: string;
  name: string;
}

const bidOptions: { level: BidValue; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  {
    level: "YES",
    label: "Interested",
    icon: <ThumbsUp className="h-4 w-4" />,
    color: "bg-green-500 hover:bg-green-600",
    description: "I want to review this paper"
  },
  {
    level: "MAYBE",
    label: "Maybe",
    icon: <HelpCircle className="h-4 w-4" />,
    color: "bg-yellow-500 hover:bg-yellow-600",
    description: "I can review if needed"
  },
  {
    level: "NO",
    label: "Not Interested",
    icon: <ThumbsDown className="h-4 w-4" />,
    color: "bg-gray-500 hover:bg-gray-600",
    description: "I don't want to review this"
  },
  {
    level: "CONFLICT",
    label: "Conflict of Interest",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-red-500 hover:bg-red-600",
    description: "I have a conflict with this paper"
  },
];

export default function BiddingPage() {
  const { permissions } = useAuthStore();
  const { toast } = useToast();

  const [papers, setPapers] = useState<PaperForBidding[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [selectedConference, setSelectedConference] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingBids, setSavingBids] = useState<Set<string>>(new Set());

  // Fetch conferences where user is a reviewer
  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await conferenceApi.getAll();
        const allConferences = response.data?.data || response.data || [];
        // Filter to conferences where user has reviewer role (from auth store)
        setConferences(allConferences);
        if (allConferences.length > 0 && !selectedConference) {
          setSelectedConference(allConferences[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch conferences:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load conferences",
        });
      }
    };
    fetchConferences();
  }, []);

  // Fetch papers for bidding
  const fetchPapers = async () => {
    if (!selectedConference) {
      setLoading(false);
      return;
    }

    try {
      const response = await biddingApi.getPapersForBidding(selectedConference);
      const papersData = response.data?.data || response.data || [];
      setPapers(papersData);
    } catch (error: any) {
      console.error("Failed to fetch papers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load papers for bidding",
      });
      setPapers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedConference) {
      setLoading(true);
      fetchPapers();
    }
  }, [selectedConference]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPapers();
  };

  const handleBid = async (paperId: string, level: BidValue) => {
    setSavingBids((prev) => new Set(prev).add(paperId));

    try {
      await biddingApi.submitBid(paperId, level);

      // Update local state
      setPapers((prev) =>
        prev.map((p) =>
          p.id === paperId ? { ...p, currentBid: level } : p
        )
      );

      toast({
        title: "Bid Saved",
        description: level === "CONFLICT"
          ? "Conflict of interest declared"
          : `Your bid has been recorded`,
      });
    } catch (error: any) {
      console.error("Failed to set bid:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to save bid",
      });
    } finally {
      setSavingBids((prev) => {
        const next = new Set(prev);
        next.delete(paperId);
        return next;
      });
    }
  };

  const filteredPapers = useMemo(() => {
    if (!searchQuery.trim()) return papers;
    const query = searchQuery.toLowerCase();
    return papers.filter((paper) =>
      paper.title.toLowerCase().includes(query) ||
      paper.abstract?.toLowerCase().includes(query) ||
      paper.track?.name.toLowerCase().includes(query)
    );
  }, [papers, searchQuery]);

  const stats = useMemo(() => ({
    total: papers.length,
    bidded: papers.filter((p) => p.currentBid).length,
    yes: papers.filter((p) => p.currentBid === "YES").length,
    maybe: papers.filter((p) => p.currentBid === "MAYBE").length,
    no: papers.filter((p) => p.currentBid === "NO").length,
    conflict: papers.filter((p) => p.currentBid === "CONFLICT").length,
  }), [papers]);

  const getBidBadgeColor = (bid: BidValue) => {
    switch (bid) {
      case "YES": return "bg-green-500";
      case "MAYBE": return "bg-yellow-500";
      case "NO": return "bg-gray-500";
      case "CONFLICT": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getBidLabel = (bid: BidValue) => {
    switch (bid) {
      case "YES": return "Interested";
      case "MAYBE": return "Maybe";
      case "NO": return "Not Interested";
      case "CONFLICT": return "Conflict";
      default: return bid;
    }
  };

  return (
    <DashboardLayout allowedRoles={["reviewer", "chair", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-8 w-8" />
              Paper Bidding
            </h1>
            <p className="text-muted-foreground">
              Express your interest in reviewing papers and declare conflicts of interest
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || !selectedConference}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Conference Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Select Conference</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedConference} onValueChange={setSelectedConference}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a conference" />
              </SelectTrigger>
              <SelectContent>
                {conferences.map((conf) => (
                  <SelectItem key={conf.id} value={conf.id}>
                    {conf.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedConference && (
          <>
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Bidded</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.bidded}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round((stats.bidded / stats.total) * 100) : 0}% complete
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Interested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.yes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-600">Maybe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.maybe}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Not Interested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{stats.no}</div>
                </CardContent>
              </Card>
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Conflicts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.conflict}</div>
                </CardContent>
              </Card>
            </div>

            {/* Conflict Info */}
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Conflict of Interest Declaration
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      If you are an author of a paper, have a close relationship with an author,
                      or have any other conflict of interest, please mark it as "Conflict of Interest".
                      This ensures fair and unbiased reviews.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search papers by title, abstract, or track..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Papers List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-2">
                          {[1, 2, 3, 4].map((j) => (
                            <Skeleton key={j} className="h-9 w-28" />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPapers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Target className="h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No Papers Found</h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search"
                      : "No papers available for bidding in this conference"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPapers.map((paper) => (
                  <Card key={paper.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <FileText className="mt-1 h-5 w-5 text-muted-foreground shrink-0" />
                              <div>
                                <h3 className="font-semibold leading-tight">{paper.title}</h3>
                                {paper.track && (
                                  <Badge variant="outline" className="mt-1">
                                    {paper.track.name}
                                  </Badge>
                                )}
                                {paper.abstract && (
                                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                    {paper.abstract}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {paper.currentBid && (
                            <Badge className={cn("shrink-0", getBidBadgeColor(paper.currentBid))}>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              {getBidLabel(paper.currentBid)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {bidOptions.map((option) => (
                            <Button
                              key={option.level}
                              variant={paper.currentBid === option.level ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                paper.currentBid === option.level && option.color,
                                "transition-all"
                              )}
                              onClick={() => handleBid(paper.id, option.level)}
                              disabled={savingBids.has(paper.id)}
                              title={option.description}
                            >
                              {savingBids.has(paper.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                option.icon
                              )}
                              <span className="ml-2">{option.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {!selectedConference && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Target className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Select a Conference</h3>
              <p className="mt-2 text-center text-muted-foreground">
                Please select a conference to view papers for bidding
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
