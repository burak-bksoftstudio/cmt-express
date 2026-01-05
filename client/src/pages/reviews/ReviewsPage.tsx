import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { reviewApi } from "@/lib/api";
import { useConferenceId } from "@/hooks/use-conference-id";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Star,
  ChevronRight,
  Search,
  Filter,
  Edit,
  Calendar,
  Layers,
  RefreshCw,
} from "lucide-react";

interface AssignedReview {
  id: string;
  assignmentId: string;
  status: "not_started" | "draft" | "submitted";
  paper: {
    id: string;
    title: string;
    abstract?: string;
    conference?: {
      id: string;
      name: string;
    };
    track?: {
      name: string;
    };
  };
  deadline?: string;
  createdAt: string;
}

const statusConfig = {
  not_started: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: AlertTriangle,
  },
  draft: {
    label: "Draft",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Edit,
  },
  submitted: {
    label: "Submitted",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
};

export default function ReviewsPage() {
  const conferenceId = useConferenceId(); // Get conference ID from URL or store
  const [assignments, setAssignments] = useState<AssignedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchAssignments = async () => {
    try {
      const response = await reviewApi.getAssigned();
      const data = response.data?.data || [];
      const normalized = data.map((item: any) => ({
        ...item,
        status: item.status || (item.review ? "draft" : "not_started"),
      }));

      // Filter by conference ID if available
      const filtered = conferenceId
        ? normalized.filter((a: AssignedReview) => a.paper.conference?.id === conferenceId)
        : normalized;

      setAssignments(filtered);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      setAssignments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [conferenceId]); // Re-fetch when conference changes

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch =
        a.paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.paper.conference?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const notStarted = assignments.filter((a) => a.status === "not_started").length;
    const drafts = assignments.filter((a) => a.status === "draft").length;
    const submitted = assignments.filter((a) => a.status === "submitted").length;
    const overdue = assignments.filter((a) => {
      if (!a.deadline || a.status === "submitted") return false;
      return new Date(a.deadline) < new Date();
    }).length;
    return { notStarted, drafts, submitted, overdue, total: assignments.length };
  }, [assignments]);

  const pendingAssignments = filteredAssignments.filter((a) => a.status !== "submitted");
  const completedAssignments = filteredAssignments.filter((a) => a.status === "submitted");

  return (
    <DashboardLayout allowedRoles={["reviewer", "chair", "admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Reviews</h1>
            <p className="text-muted-foreground">
              Manage your assigned paper reviews
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Not Started</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notStarted}</div>
              <p className="text-xs text-muted-foreground">Awaiting your review</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Edit className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drafts}</div>
              <p className="text-xs text-muted-foreground">Draft reviews</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submitted}</div>
              <p className="text-xs text-muted-foreground">Submitted reviews</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">Past deadline</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue Warning Banner */}
        {stats.overdue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {stats.overdue} Overdue Review{stats.overdue > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      You have {stats.overdue} review{stats.overdue > 1 ? "s" : ""} past the deadline. Please submit them as soon as possible.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by paper title or conference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Pending Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Pending Reviews
              </CardTitle>
              <CardDescription>Papers waiting for your review</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingAssignments.length === 0 ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <p className="mt-4 font-semibold text-lg">All Caught Up!</p>
                  <p className="text-sm text-muted-foreground">
                    No pending reviews at this time
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {pendingAssignments.map((assignment, index) => {
                      const status = statusConfig[assignment.status] || statusConfig.not_started;
                      const StatusIcon = status.icon;
                      const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();

                      return (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01 }}
                          className="group"
                        >
                          <div className="rounded-lg border p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:bg-accent/30">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                    <FileText className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                                      {assignment.paper.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                      {assignment.paper.abstract}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  <Badge className={status.color}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {status.label}
                                  </Badge>
                                  {assignment.paper.conference && (
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {assignment.paper.conference.name}
                                    </span>
                                  )}
                                  {assignment.paper.track && (
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                      <Layers className="h-3.5 w-3.5" />
                                      {assignment.paper.track.name}
                                    </span>
                                  )}
                                  {assignment.deadline && (
                                    <span className={`flex items-center gap-1.5 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                                      <Clock className={`h-3.5 w-3.5 ${isOverdue ? "animate-pulse" : ""}`} />
                                      {isOverdue ? "Overdue: " : "Due: "}
                                      {new Date(assignment.deadline).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Link to={`/reviews/${assignment.id}`}>
                                <Button className="gap-2 shrink-0">
                                  {assignment.status === "draft" ? (
                                    <>
                                      <Edit className="h-4 w-4" />
                                      Continue
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRight className="h-4 w-4" />
                                      Review
                                    </>
                                  )}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Completed Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed Reviews
              </CardTitle>
              <CardDescription>Your submitted reviews</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : completedAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Star className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-4 text-muted-foreground">
                    No completed reviews yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {completedAssignments.map((assignment, index) => (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-lg border p-4 bg-green-50/50 dark:bg-green-900/10"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-3">
                              <FileText className="mt-1 h-5 w-5 text-green-600 dark:text-green-400" />
                              <div>
                                <h4 className="font-semibold">{assignment.paper.title}</h4>
                                {assignment.paper.conference && (
                                  <p className="text-sm text-muted-foreground">
                                    {assignment.paper.conference.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Submitted
                            </Badge>
                            <Link to={`/reviews/${assignment.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
