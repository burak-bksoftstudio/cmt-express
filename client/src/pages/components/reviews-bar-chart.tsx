

import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Card as TremorCard, Title, Text, BarChart } from "@tremor/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/stores/dashboard-store";
import { appleEasing } from "@/components/motion";
import { BarChart3 } from "lucide-react";

export function ReviewsBarChart() {
  // translations removed
  const { stats, statsLoading, selectedConferenceId } = useDashboardStore();
  const assignedLabel = t("categories.assigned");
  const completedLabel = t("categories.completed");

  // Placeholder when no conference selected
  if (!selectedConferenceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
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
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 flex-1" />
            </div>
          ))}
        </div>
      </TremorCard>
    );
  }

  const reviewers = stats?.reviewers || [];

  // If no reviewers, show empty state
  if (reviewers.length === 0) {
    return (
      <TremorCard className="p-6">
        <Title>{t("title")}</Title>
        <Text>{t("subtitle")}</Text>
        <div className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      </TremorCard>
    );
  }

  // Prepare chart data (top 10 reviewers by assignment)
  const chartData = reviewers
    .slice(0, 10)
    .map((reviewer) => ({
      name: `${reviewer.firstName} ${reviewer.lastName.charAt(0)}.`,
      [assignedLabel]: reviewer.assigned,
      [completedLabel]: reviewer.completed,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: appleEasing, delay: 0.1 }}
      whileHover={{
        boxShadow: "0 8px 30px -8px rgba(0,0,0,0.12)",
        transition: { duration: 0.25, ease: appleEasing },
      }}
      style={{ willChange: "opacity, transform, box-shadow" }}
    >
      <TremorCard className="p-6">
        <Title>{t("title")}</Title>
        <Text>{t("subtitleDetailed")}</Text>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: appleEasing, delay: 0.3 }}
        >
          <BarChart
            className="mt-6 h-60"
            data={chartData}
            index="name"
            categories={[assignedLabel, completedLabel]}
            colors={["violet", "green"]}
            showAnimation={true}
            showTooltip={true}
            showLegend={true}
            yAxisWidth={40}
          />
        </motion.div>
      </TremorCard>
    </motion.div>
  );
}

