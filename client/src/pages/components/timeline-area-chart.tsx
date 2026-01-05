

import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Card as TremorCard, Title, Text, AreaChart } from "@tremor/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/stores/dashboard-store";
import { appleEasing } from "@/components/motion";
import { TrendingUp } from "lucide-react";

export function TimelineAreaChart() {
  // translations removed
  const { stats, statsLoading, selectedConferenceId } = useDashboardStore();
  const submissionsLabel = t("series.submissions");
  const reviewsLabel = t("series.reviews");

  // Placeholder when no conference selected
  if (!selectedConferenceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            {t("selectConference")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (statsLoading) {
    return (
      <TremorCard className="p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-72 w-full" />
      </TremorCard>
    );
  }

  const timeline = stats?.timeline || [];

  // If no timeline data, show empty state
  if (timeline.length === 0) {
    return (
      <TremorCard className="p-6">
        <Title>{t("title")}</Title>
        <Text>{t("subtitle")}</Text>
        <div className="flex flex-col items-center justify-center py-16">
          <TrendingUp className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            {t("empty")}
          </p>
        </div>
      </TremorCard>
    );
  }

  // Prepare chart data
  const chartData = timeline.map((entry) => ({
    date: entry.date,
    [submissionsLabel]: entry.submissions,
    [reviewsLabel]: entry.reviews,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: appleEasing, delay: 0.2 }}
      whileHover={{
        boxShadow: "0 8px 30px -8px rgba(0,0,0,0.12)",
        transition: { duration: 0.25, ease: appleEasing },
      }}
      style={{ willChange: "opacity, transform, box-shadow" }}
    >
      <TremorCard className="p-6">
        <Title>{t("title")}</Title>
        <Text>{t("subtitle")}</Text>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: appleEasing, delay: 0.4 }}
        >
          <AreaChart
            className="mt-6 h-72"
            data={chartData}
            index="date"
            categories={[submissionsLabel, reviewsLabel]}
            colors={["violet", "cyan"]}
            showAnimation={true}
            showTooltip={true}
            showLegend={true}
            curveType="monotone"
            yAxisWidth={40}
          />
        </motion.div>
      </TremorCard>
    </motion.div>
  );
}

