import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaperStatusBadge, UserAvatarGroup } from "@/components/papers";
import { useAuth } from "@/hooks/use-auth";
import { useConferenceStore } from "@/stores/conference-store";
import { paperApi } from "@/lib/api";
import { Paper, Conference, User, PaperAuthor, PaperKeyword } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Eye,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
  X,
  Calendar,
  Tag,
} from "lucide-react";

interface PaperWithDetails extends Paper {
  authors?: (PaperAuthor & { user?: Partial<User> })[];
  conference?: Conference;
  keywords?: (PaperKeyword & { keyword?: { id: string; name: string } })[];
}

const statusValues = ["all", "submitted", "under_review", "accepted", "rejected", "revision"] as const;
const ITEMS_PER_PAGE = 10;

export default function PapersPage() {
  const { permissions, isChairOfConference } = useAuth();
  const { activeConferenceId } = useConferenceStore();
  const [papers, setPapers] = useState<PaperWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [keywordFilter, setKeywordFilter] = useState("all");

  // Check if user is chair of the active conference
  const isChairOfActiveConference = activeConferenceId ? isChairOfConference(activeConferenceId) : false;

  const allKeywords = useMemo(() => {
    const keywordSet = new Map<string, string>();
    papers.forEach((paper) => {
      paper.keywords?.forEach((kw) => {
        if (kw.keyword) {
          keywordSet.set(kw.keyword.id, kw.keyword.name);
        }
      });
    });
    return Array.from(keywordSet, ([id, name]) => ({ id, name }));
  }, [papers]);

  const fetchPapers = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      if (permissions.isAdmin) {
        // Admin sees all papers
        response = await paperApi.getAll();
      } else if (isChairOfActiveConference && activeConferenceId) {
        // Chair sees all papers in their conference
        response = await paperApi.getConferencePapers(activeConferenceId);
      } else {
        // Authors see only their papers
        response = await paperApi.getMyPapers(activeConferenceId || undefined);
      }

      setPapers(response.data.data || []);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load papers";
      setError(message);
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [permissions.isAdmin, isChairOfActiveConference, activeConferenceId]);

  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      if (searchQuery && !paper.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && paper.status !== statusFilter) {
        return false;
      }
      if (keywordFilter !== "all") {
        const hasKeyword = paper.keywords?.some((kw) => kw.keyword?.id === keywordFilter);
        if (!hasKeyword) return false;
      }
      return true;
    });
  }, [papers, searchQuery, statusFilter, keywordFilter]);

  const totalPages = Math.ceil(filteredPapers.length / ITEMS_PER_PAGE);
  const paginatedPapers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPapers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPapers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, keywordFilter]);

  const stats = useMemo(() => ({
    total: papers.length,
    submitted: papers.filter((p) => p.status === "submitted").length,
    underReview: papers.filter((p) => p.status === "under_review").length,
    accepted: papers.filter((p) => p.status === "accepted").length,
    rejected: papers.filter((p) => p.status === "rejected").length,
  }), [papers]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setKeywordFilter("all");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all" || keywordFilter !== "all";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {permissions.isAdmin ? "All Papers" : isChairOfActiveConference ? "Conference Papers" : "My Papers"}
            </h1>
            <p className="text-muted-foreground">
              {permissions.isAdmin
                ? "Manage all submitted papers"
                : isChairOfActiveConference
                  ? "Manage papers in your conference"
                  : "View and manage your paper submissions"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchPapers} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {(permissions.isAuthor || permissions.isAdmin) && (
              <Link to="/papers/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Paper
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.underReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                </SelectContent>
              </Select>
              {allKeywords.length > 0 && (
                <Select value={keywordFilter} onValueChange={setKeywordFilter}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue placeholder="Filter by keyword" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Keywords</SelectItem>
                    {allKeywords.map((kw) => (
                      <SelectItem key={kw.id} value={kw.id}>{kw.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Papers List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPapers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">No Papers Found</h3>
              <p className="mt-2 max-w-sm text-center text-muted-foreground">
                {hasActiveFilters ? "Try adjusting your filters" : "No papers have been submitted yet"}
              </p>
              <div className="mt-6 flex gap-3">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
                {!hasActiveFilters && (permissions.isAuthor || permissions.isAdmin) && (
                  <Link to="/papers/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Submit Paper
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedPapers.map((paper) => (
                <Card key={paper.id} className="transition-all hover:shadow-md hover:border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold leading-tight line-clamp-2">{paper.title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {paper.abstract || "No abstract provided"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                          {(permissions.isAdmin || permissions.isChair) && paper.conference && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{paper.conference.name}</span>
                            </div>
                          )}
                          <span className="text-muted-foreground">
                            Submitted {formatDate(paper.createdAt)}
                          </span>
                          {paper.authors && paper.authors.length > 0 && (
                            <UserAvatarGroup
                              users={paper.authors.filter((a) => a.user).map((a) => ({
                                firstName: a.user?.firstName || "",
                                lastName: a.user?.lastName || "",
                                email: a.user?.email,
                              }))}
                              size="sm"
                              max={3}
                            />
                          )}
                        </div>
                        {paper.keywords && paper.keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            {paper.keywords.slice(0, 3).map((kw) => (
                              <Badge key={kw.id} variant="outline" className="text-xs">
                                {kw.keyword?.name}
                              </Badge>
                            ))}
                            {paper.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{paper.keywords.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
                        <PaperStatusBadge status={paper.status} />
                        <Link to={`/papers/${paper.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPapers.length)} of {filteredPapers.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
