import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reviewAssignmentApi } from "@/lib/api";
import { useSimpleToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ManualAssignmentDialog } from "@/components/assignment/ManualAssignmentDialog";
import {
  ArrowLeft,
  Users,
  FileText,
  Search,
  RefreshCw,
  Wand2,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  UserCheck,
  Clock,
  Edit,
} from "lucide-react";

interface ReviewerStat {
  reviewerId: string;
  name: string;
  totalAssigned: number;
  notStarted: number;
  inProgress: number;
  completed: number;
}

interface PaperStat {
  paperId: string;
  title: string;
  assignedReviewers: number;
  assignments: {
    assignmentId: string;
    reviewerId: string;
    reviewerName: string;
    status: string;
  }[];
}

interface AssignmentStats {
  papers: PaperStat[];
  reviewers: ReviewerStat[];
  summary: {
    totalPapers: number;
    papersWithAssignments: number;
    papersWithoutAssignments: number;
    totalAssignments: number;
    averageReviewersPerPaper: string;
  };
}

export default function ConferenceAssignmentsPage() {
  const params = useParams();
  const conferenceId = params.id as string;
  const { addToast, ToastRenderer } = useSimpleToast();

  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<PaperStat | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await reviewAssignmentApi.getConferenceStats(conferenceId);
      setStats(response.data?.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      addToast({
        type: "error",
        title: "Load Failed",
        description: "Failed to load assignment statistics",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (conferenceId) {
      fetchStats();
    }
  }, [conferenceId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    try {
      const response = await reviewAssignmentApi.autoAssign(conferenceId);
      const result = response.data?.data;
      addToast({
        type: "success",
        title: "Auto-Assign Complete",
        description: `Successfully assigned ${result?.totalAssigned || 0} reviewers`,
      });
      fetchStats();
    } catch (error: any) {
      const message = error.response?.data?.message || "Auto-assign failed";
      addToast({
        type: "error",
        title: "Auto-Assign Failed",
        description: message,
      });
    } finally {
      setAutoAssigning(false);
    }
  };

  // Filter papers by search
  const filteredPapers = useMemo(() => {
    if (!stats?.papers) return [];
    if (!searchQuery.trim()) return stats.papers;
    return stats.papers.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stats?.papers, searchQuery]);

  // Calculate reviewer load distribution for chart
  const maxReviewerLoad = useMemo(() => {
    if (!stats?.reviewers) return 0;
    return Math.max(...stats.reviewers.map((r) => r.totalAssigned), 1);
  }, [stats?.reviewers]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
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
                <UserCheck className="h-6 w-6" />
                Review Assignments
              </h1>
              <p className="text-muted-foreground">
                Manage reviewer assignments for papers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={handleAutoAssign}
              disabled={autoAssigning}
              className="gap-2"
            >
              {autoAssigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {autoAssigning ? "Assigning..." : "Auto-Assign"}
            </Button>
          </div>
        </motion.div>

        {/* Summary Stats */}
        {stats && (
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
                <div className="text-2xl font-bold">{stats.summary.totalPapers}</div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">With Assignments</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.summary.papersWithAssignments}
                </div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Missing Assignments</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.summary.papersWithoutAssignments}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Per Paper</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.summary.averageReviewersPerPaper}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reviewer Load Chart */}
        {stats && stats.reviewers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Reviewer Load
                </CardTitle>
                <CardDescription>
                  Distribution of assignments across reviewers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.reviewers.map((reviewer, index) => (
                    <motion.div
                      key={reviewer.reviewerId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[200px]">
                          {reviewer.name}
                        </span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {reviewer.notStarted}
                          </span>
                          <span className="text-yellow-500 flex items-center gap-1">
                            <Edit className="h-3 w-3" />
                            {reviewer.inProgress}
                          </span>
                          <span className="text-green-500 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {reviewer.completed}
                          </span>
                          <Badge variant="secondary">{reviewer.totalAssigned}</Badge>
                        </div>
                      </div>
                      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(reviewer.totalAssigned / maxReviewerLoad) * 100}%`,
                          }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className="absolute inset-y-0 left-0 bg-primary rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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

        {/* Papers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Papers
              </CardTitle>
              <CardDescription>
                View and manage paper assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[300px]">Paper</TableHead>
                      <TableHead className="w-[100px]">Reviewers</TableHead>
                      <TableHead className="min-w-[200px]">Assigned</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredPapers.map((paper, index) => (
                        <motion.tr
                          key={paper.paperId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            "group",
                            paper.assignedReviewers === 0 &&
                              "bg-yellow-50/50 dark:bg-yellow-900/10"
                          )}
                        >
                          <TableCell>
                            <p className="font-medium line-clamp-2">{paper.title}</p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={paper.assignedReviewers === 0 ? "destructive" : "secondary"}
                            >
                              {paper.assignedReviewers}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {paper.assignments.length === 0 ? (
                                <span className="text-sm text-muted-foreground italic">
                                  No reviewers assigned
                                </span>
                              ) : (
                                paper.assignments.slice(0, 3).map((a) => (
                                  <Badge
                                    key={a.reviewerId}
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      a.status === "SUBMITTED" &&
                                        "border-green-300 text-green-600",
                                      a.status === "DRAFT" &&
                                        "border-yellow-300 text-yellow-600"
                                    )}
                                  >
                                    {a.reviewerName.split(" ")[0]}
                                  </Badge>
                                ))
                              )}
                              {paper.assignments.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{paper.assignments.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => {
                                  setSelectedPaper(paper);
                                  setAssignDialogOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                                Manage
                              </Button>
                              <Link to={`/papers/${paper.paperId}`}>
                                <Button variant="ghost" size="sm" className="gap-1">
                                  View
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>

                {filteredPapers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Papers Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "Try adjusting your search"
                        : "No papers in this conference"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <ToastRenderer />

      {/* Manual Assignment Dialog */}
      {selectedPaper && (
        <ManualAssignmentDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          paperId={selectedPaper.paperId}
          paperTitle={selectedPaper.title}
          conferenceId={conferenceId}
          existingAssignments={selectedPaper.assignments}
          onAssignmentChange={() => {
            fetchStats();
          }}
        />
      )}
    </DashboardLayout>
  );
}
