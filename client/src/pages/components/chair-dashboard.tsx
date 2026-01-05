import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { dashboardApi } from "@/lib/api";
import {
  Calendar,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Target,
  ClipboardList,
} from "lucide-react";

interface ConferenceStats {
  papers: {
    total: number;
    submitted: number;
    accepted: number;
    rejected: number;
    cameraReady: number;
  };
  reviews: {
    totalReviews: number;
    averageScore: number | null;
    averageConfidence: number | null;
  };
  reviewers: Array<{
    reviewerId: string;
    firstName: string;
    lastName: string;
    email: string;
    totalAssigned: number;
    completedReviews: number;
  }>;
}

const appleEasing = [0.16, 1, 0.3, 1] as const;

interface ChairDashboardProps {
  conferenceId: string;
}

export function ChairDashboard({ conferenceId }: ChairDashboardProps) {
  const [stats, setStats] = useState<ConferenceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!conferenceId) {
        setLoading(false);
        return;
      }

      try {
        const response = await dashboardApi.getConferenceStats(conferenceId);
        setStats(response.data);
      } catch (err) {
        console.error("Failed to fetch conference stats:", err);
        setError("Konferans istatistikleri yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [conferenceId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
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

  if (!stats) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Bir konferans seçin</AlertDescription>
      </Alert>
    );
  }

  const reviewProgress = stats.papers.total > 0
    ? Math.round((stats.reviews.totalReviews / (stats.papers.total * 3)) * 100)
    : 0;

  const decisionProgress = stats.papers.submitted > 0
    ? Math.round(((stats.papers.accepted + stats.papers.rejected) / stats.papers.submitted) * 100)
    : 0;

  const pendingDecisions = stats.papers.submitted - (stats.papers.accepted + stats.papers.rejected);

  const reviewersNeedingAttention = stats.reviewers.filter(
    (r) => r.completedReviews < r.totalAssigned
  ).length;

  return (
    <div className="space-y-6">
      {/* Main Stats */}
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
                  <p className="text-sm font-medium text-muted-foreground">Toplam Makale</p>
                  <p className="text-2xl font-bold">{stats.papers.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.papers.submitted} gönderildi
                  </p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kabul Edildi</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.papers.accepted}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.papers.submitted > 0
                      ? `%${Math.round((stats.papers.accepted / stats.papers.submitted) * 100)}`
                      : "0%"}{" "}
                    kabul oranı
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam İnceleme</p>
                  <p className="text-2xl font-bold">{stats.reviews.totalReviews}</p>
                  {stats.reviews.averageScore && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ort. puan: {stats.reviews.averageScore.toFixed(1)}/10
                    </p>
                  )}
                </div>
                <ClipboardList className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">İncelemeciler</p>
                  <p className="text-2xl font-bold">{stats.reviewers.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reviewersNeedingAttention} bekleyen görev
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Progress Indicators */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-500" />
                İnceleme İlerlemesi
              </CardTitle>
              <CardDescription>
                {stats.reviews.totalReviews} / {stats.papers.total * 3} hedef inceleme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={reviewProgress} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">
                  %{reviewProgress} tamamlandı
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Karar İlerlemesi
              </CardTitle>
              <CardDescription>
                {stats.papers.accepted + stats.papers.rejected} / {stats.papers.submitted} makale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={decisionProgress} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">
                  %{decisionProgress} karara bağlandı
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Bekleyen İşlemler
            </CardTitle>
            <CardDescription>Dikkat gerektiren konular</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingDecisions > 0 && (
                <Link to={`/conferences/${conferenceId}/assignments`}>
                  <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10 p-4 transition-colors hover:bg-yellow-100 dark:hover:bg-yellow-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Karar Bekleyen Makaleler</h4>
                        <p className="text-xs text-muted-foreground">
                          {pendingDecisions} makale için karar verilmeli
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {pendingDecisions}
                    </Badge>
                  </div>
                </Link>
              )}

              {reviewersNeedingAttention > 0 && (
                <Link to={`/conferences/${conferenceId}/assignments`}>
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/10 p-4 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Tamamlanmamış İncelemeler</h4>
                        <p className="text-xs text-muted-foreground">
                          {reviewersNeedingAttention} incelemeci görevini tamamlamadı
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {reviewersNeedingAttention}
                    </Badge>
                  </div>
                </Link>
              )}

              {stats.papers.cameraReady > 0 && (
                <Link to="/camera-ready">
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10 p-4 transition-colors hover:bg-green-100 dark:hover:bg-green-900/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Camera Ready Dosyalar</h4>
                        <p className="text-xs text-muted-foreground">
                          {stats.papers.cameraReady} dosya onay bekliyor
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {stats.papers.cameraReady}
                    </Badge>
                  </div>
                </Link>
              )}

              {pendingDecisions === 0 && reviewersNeedingAttention === 0 && stats.papers.cameraReady === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-muted-foreground">
                    Harika! Bekleyen işleminiz yok.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Reviewers */}
      {stats.reviewers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    En Aktif İncelemeciler
                  </CardTitle>
                  <CardDescription>İnceleme sayısına göre</CardDescription>
                </div>
                <Link to={`/conferences/${conferenceId}/members`}>
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.reviewers.slice(0, 5).map((reviewer, index) => {
                  const completionRate = reviewer.totalAssigned > 0
                    ? Math.round((reviewer.completedReviews / reviewer.totalAssigned) * 100)
                    : 0;

                  return (
                    <motion.div
                      key={reviewer.reviewerId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {reviewer.firstName[0]}{reviewer.lastName[0]}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {reviewer.firstName} {reviewer.lastName}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {reviewer.completedReviews} / {reviewer.totalAssigned} tamamlandı
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={completionRate === 100 ? "default" : "outline"}
                          className={
                            completionRate === 100
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : ""
                          }
                        >
                          %{completionRate}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Hızlı İşlemler
            </CardTitle>
            <CardDescription>Konferans yönetimi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link to={`/conferences/${conferenceId}/assignments`}>
                <div className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Atamalar</h4>
                    <p className="text-sm text-muted-foreground">İncelemeci ata</p>
                  </div>
                </div>
              </Link>

              <Link to={`/conferences/${conferenceId}/members`}>
                <div className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Üyeler</h4>
                    <p className="text-sm text-muted-foreground">Üyeleri yönet</p>
                  </div>
                </div>
              </Link>

              <Link to={`/conferences/${conferenceId}/settings`}>
                <div className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Ayarlar</h4>
                    <p className="text-sm text-muted-foreground">Konferans ayarları</p>
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
