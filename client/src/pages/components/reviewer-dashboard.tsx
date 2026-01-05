import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { reviewAssignmentApi } from "@/lib/api";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  FileText,
  Star,
} from "lucide-react";

interface ReviewAssignment {
  id: string;
  status: string;
  dueDate?: string;
  paper: {
    id: string;
    title: string;
    conference: {
      id: string;
      name: string;
    };
  };
  review?: {
    score?: number;
    submittedAt?: string;
  };
}

const appleEasing = [0.16, 1, 0.3, 1] as const;

export function ReviewerDashboard() {
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await reviewAssignmentApi.getMyAssignments();
        const data = response.data?.data || response.data || [];
        setAssignments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
        setError("İnceleme görevleri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const pendingReviews = assignments.filter((a) => a.status !== "SUBMITTED");
  const completedReviews = assignments.filter((a) => a.status === "SUBMITTED");
  const overdueReviews = pendingReviews.filter((a) => {
    if (!a.dueDate) return false;
    return new Date(a.dueDate) < new Date();
  });

  const stats = {
    total: assignments.length,
    pending: pendingReviews.length,
    completed: completedReviews.length,
    overdue: overdueReviews.length,
    completionRate: assignments.length > 0
      ? Math.round((completedReviews.length / assignments.length) * 100)
      : 0,
  };

  const getUpcomingDeadlines = () => {
    const now = new Date();
    return pendingReviews
      .filter((a) => a.dueDate)
      .map((a) => ({
        assignment: a,
        deadline: new Date(a.dueDate!),
        daysLeft: Math.ceil(
          (new Date(a.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      }))
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 5);
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing }}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Görev</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bekleyen</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tamamlanan</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gecikmiş</p>
                  <p className="text-2xl font-bold">{stats.overdue}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Completion Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              İnceleme İlerlemesi
            </CardTitle>
            <CardDescription>
              {stats.completed} / {stats.total} inceleme tamamlandı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={stats.completionRate} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                %{stats.completionRate} tamamlandı
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Reviews */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Bekleyen İncelemeler
                  </CardTitle>
                  <CardDescription>
                    {stats.pending} inceleme bekliyor
                  </CardDescription>
                </div>
                <Link to="/reviews">
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {pendingReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-muted-foreground">
                    Bekleyen incelemeniz yok!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReviews.slice(0, 5).map((assignment, index) => {
                    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
                    return (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link to={`/reviews/${assignment.id}`}>
                          <div
                            className={`flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent ${
                              isOverdue
                                ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10"
                                : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-1">
                                {assignment.paper.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {assignment.paper.conference.name}
                              </p>
                              {assignment.dueDate && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Son tarih:{" "}
                                  {new Date(assignment.dueDate).toLocaleDateString("tr-TR")}
                                </p>
                              )}
                            </div>
                            {isOverdue ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Gecikmiş
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              >
                                <Clock className="mr-1 h-3 w-3" />
                                {assignment.status === "DRAFT" ? "Taslak" : "Bekliyor"}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Yaklaşan Son Tarihler
              </CardTitle>
              <CardDescription>İnceleme son tarihleri</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-muted-foreground">
                    Yaklaşan son tarihiniz yok
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((item, index) => {
                    const isUrgent = item.daysLeft <= 3;
                    const isWarning = item.daysLeft <= 7 && item.daysLeft > 3;
                    return (
                      <motion.div
                        key={item.assignment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`rounded-lg border p-3 ${
                          isUrgent
                            ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10"
                            : isWarning
                            ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {item.assignment.paper.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.deadline.toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <Badge
                            variant={
                              isUrgent
                                ? "destructive"
                                : isWarning
                                ? "default"
                                : "outline"
                            }
                            className={
                              isWarning && !isUrgent
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : ""
                            }
                          >
                            {item.daysLeft <= 0 ? "Bugün" : `${item.daysLeft} Gün`}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Hızlı İşlemler
            </CardTitle>
            <CardDescription>Sık kullanılan işlemler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link to="/reviews">
                <div className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">İncelemelerim</h4>
                    <p className="text-sm text-muted-foreground">Tüm görevler</p>
                  </div>
                </div>
              </Link>
              <Link to="/bidding">
                <div className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Teklifler</h4>
                    <p className="text-sm text-muted-foreground">Makale seçimi</p>
                  </div>
                </div>
              </Link>
              <Link to="/reviews">
                <div className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">İstatistikler</h4>
                    <p className="text-sm text-muted-foreground">İnceleme geçmişi</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
