import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { paperApi } from "@/lib/api";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface Paper {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  conference: {
    id: string;
    name: string;
    settings?: {
      submissionDeadline?: string;
    };
  };
  decision?: {
    finalDecision: string;
    decidedAt: string;
  };
  _count?: {
    reviewAssignments: number;
  };
}

const appleEasing = [0.16, 1, 0.3, 1] as const;

export function AuthorDashboard() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await paperApi.getMyPapers();
        const papersData = response.data?.data || response.data || [];
        setPapers(Array.isArray(papersData) ? papersData.slice(0, 5) : []);
      } catch (err) {
        console.error("Failed to fetch papers:", err);
        setError("Makaleler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, []);

  const getStatusBadge = (paper: Paper) => {
    if (paper.decision?.finalDecision === "ACCEPT") {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="mr-1 h-3 w-3" />
          Kabul Edildi
        </Badge>
      );
    }
    if (paper.decision?.finalDecision === "REJECT") {
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Reddedildi
        </Badge>
      );
    }
    if (paper.status === "camera_ready_submitted") {
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <Upload className="mr-1 h-3 w-3" />
          Camera Ready
        </Badge>
      );
    }
    if (paper.status === "submitted") {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          <Clock className="mr-1 h-3 w-3" />
          İncelemede
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        {paper.status === "draft" ? "Taslak" : "Gönderildi"}
      </Badge>
    );
  };

  const getUpcomingDeadlines = () => {
    const now = new Date();
    return papers
      .filter((p) => {
        if (!p.conference.settings?.submissionDeadline) return false;
        const deadline = new Date(p.conference.settings.submissionDeadline);
        return deadline > now && p.status === "draft";
      })
      .map((p) => ({
        paper: p,
        deadline: new Date(p.conference.settings!.submissionDeadline!),
        daysLeft: Math.ceil(
          (new Date(p.conference.settings!.submissionDeadline!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      }))
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  };

  const stats = {
    total: papers.length,
    submitted: papers.filter((p) => p.status === "submitted").length,
    accepted: papers.filter((p) => p.decision?.finalDecision === "ACCEPT").length,
    rejected: papers.filter((p) => p.decision?.finalDecision === "REJECT").length,
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
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
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
                  <p className="text-sm font-medium text-muted-foreground">Toplam Makale</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gönderilmiş</p>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kabul Edilmiş</p>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reddedilmiş</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Papers */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Makalelerim
                  </CardTitle>
                  <CardDescription>Son gönderilen makaleler</CardDescription>
                </div>
                <Link to="/papers">
                  <Button variant="outline" size="sm">
                    Tümünü Gör
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {papers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Henüz makale göndermediniz</p>
                  <Link to="/papers/submit" className="mt-4">
                    <Button size="sm">
                      <Upload className="mr-2 h-4 w-4" />
                      Makale Gönder
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {papers.map((paper, index) => (
                    <motion.div
                      key={paper.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Link to={`/papers/${paper.id}`}>
                        <div className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {paper.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {paper.conference.name}
                              </p>
                              {paper._count?.reviewAssignments ? (
                                <Badge variant="outline" className="text-xs">
                                  {paper._count.reviewAssignments} İnceleme
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          {getStatusBadge(paper)}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Yaklaşan Son Tarihler
              </CardTitle>
              <CardDescription>Gönderim son tarihleri</CardDescription>
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
                  {upcomingDeadlines.map((item, index) => (
                    <motion.div
                      key={item.paper.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`rounded-lg border p-3 ${
                        item.daysLeft <= 3
                          ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10"
                          : item.daysLeft <= 7
                          ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {item.paper.conference.name}
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
                            item.daysLeft <= 3
                              ? "destructive"
                              : item.daysLeft <= 7
                              ? "default"
                              : "outline"
                          }
                          className={
                            item.daysLeft <= 7 && item.daysLeft > 3
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : ""
                          }
                        >
                          {item.daysLeft} Gün
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
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
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.3 }}
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
              <Link to="/papers/submit">
                <div className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Makale Gönder</h4>
                    <p className="text-sm text-muted-foreground">Yeni makale ekle</p>
                  </div>
                </div>
              </Link>
              <Link to="/papers">
                <div className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Makalelerim</h4>
                    <p className="text-sm text-muted-foreground">Tüm makaleler</p>
                  </div>
                </div>
              </Link>
              <Link to="/camera-ready">
                <div className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:border-primary/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Camera Ready</h4>
                    <p className="text-sm text-muted-foreground">Final sürümler</p>
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
