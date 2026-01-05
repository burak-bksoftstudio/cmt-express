

import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/stores/dashboard-store";
import { appleEasing } from "@/components/motion";
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Camera,
  MessageSquare,
  Star,
  Shield,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
  index?: number;
}

function StatCard({ title, value, description, icon, loading, index = 0 }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        ease: appleEasing,
        delay: index * 0.08,
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 8px 30px -8px rgba(0,0,0,0.12)",
        transition: { duration: 0.25, ease: appleEasing },
      }}
      style={{ willChange: "opacity, transform, box-shadow" }}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <motion.div
            className="text-muted-foreground"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: appleEasing, delay: index * 0.08 + 0.2 }}
          >
            {icon}
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            className="text-2xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.08 + 0.3 }}
          >
            {value}
          </motion.div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StatsCards() {
  // translations removed
  const { stats, statsLoading, selectedConferenceId } = useDashboardStore();

  // Show placeholder if no conference selected
  if (!selectedConferenceId) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="text-muted-foreground/50">
                <FileText className="h-8 w-8" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("selectConference")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const paperStats = stats?.papers || {
    total: 0,
    submitted: 0,
    accepted: 0,
    rejected: 0,
    cameraReady: 0,
  };

  const reviewStats = stats?.reviews || {
    totalReviews: 0,
    averageScore: 0,
    averageConfidence: 0,
  };

  return (
    <div className="space-y-4">
      {/* Paper Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={t("papers.total.title")}
          value={paperStats.total}
          description={t("papers.total.desc")}
          icon={<FileText className="h-4 w-4" />}
          loading={statsLoading}
          index={0}
        />
        <StatCard
          title={t("papers.submitted.title")}
          value={paperStats.submitted}
          description={t("papers.submitted.desc")}
          icon={<Send className="h-4 w-4" />}
          loading={statsLoading}
          index={1}
        />
        <StatCard
          title={t("papers.accepted.title")}
          value={paperStats.accepted}
          description={t("papers.accepted.desc")}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          loading={statsLoading}
          index={2}
        />
        <StatCard
          title={t("papers.rejected.title")}
          value={paperStats.rejected}
          description={t("papers.rejected.desc")}
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          loading={statsLoading}
          index={3}
        />
        <StatCard
          title={t("papers.cameraReady.title")}
          value={paperStats.cameraReady}
          description={t("papers.cameraReady.desc")}
          icon={<Camera className="h-4 w-4 text-blue-500" />}
          loading={statsLoading}
          index={4}
        />
      </div>

      {/* Review Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title={t("reviews.total.title")}
          value={reviewStats.totalReviews}
          description={t("reviews.total.desc")}
          icon={<MessageSquare className="h-4 w-4" />}
          loading={statsLoading}
          index={5}
        />
        <StatCard
          title={t("reviews.averageScore.title")}
          value={reviewStats.averageScore.toFixed(1)}
          description={t("reviews.averageScore.desc")}
          icon={<Star className="h-4 w-4 text-yellow-500" />}
          loading={statsLoading}
          index={6}
        />
        <StatCard
          title={t("reviews.averageConfidence.title")}
          value={reviewStats.averageConfidence.toFixed(1)}
          description={t("reviews.averageConfidence.desc")}
          icon={<Shield className="h-4 w-4 text-purple-500" />}
          loading={statsLoading}
          index={7}
        />
      </div>
    </div>
  );
}

