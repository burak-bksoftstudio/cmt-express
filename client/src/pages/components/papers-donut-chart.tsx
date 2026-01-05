

import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import { Card as TremorCard, Title, Text, DonutChart, Legend } from "@tremor/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/stores/dashboard-store";
import { appleEasing } from "@/components/motion";
import { PieChart } from "lucide-react";

export function PapersDonutChart() {
  // translations removed
  const { stats, statsLoading, selectedConferenceId } = useDashboardStore();

  // Placeholder when no conference selected
  if (!selectedConferenceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <PieChart className="h-12 w-12 text-muted-foreground/50" />
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
        <Skeleton className="h-60 w-full rounded-full mx-auto max-w-[240px]" />
      </TremorCard>
    );
  }

  const paperStats = stats?.papers || {
    total: 0,
    submitted: 0,
    accepted: 0,
    rejected: 0,
    cameraReady: 0,
  };

  // If no papers, show empty state
  if (paperStats.total === 0) {
    return (
      <TremorCard className="p-6">
        <Title>{t("title")}</Title>
        <Text>{t("subtitle")}</Text>
        <div className="flex flex-col items-center justify-center py-12">
          <PieChart className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      </TremorCard>
    );
  }

  // Prepare chart data
  const chartData = [
    { name: t("categories.submitted"), value: paperStats.submitted, color: "blue" },
    { name: t("categories.accepted"), value: paperStats.accepted, color: "green" },
    { name: t("categories.rejected"), value: paperStats.rejected, color: "red" },
    { name: t("categories.cameraReady"), value: paperStats.cameraReady, color: "violet" },
  ].filter((item) => item.value > 0);

  const colors: ("blue" | "green" | "red" | "violet")[] = chartData.map(
    (item) => item.color as "blue" | "green" | "red" | "violet"
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: appleEasing }}
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
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: appleEasing, delay: 0.2 }}
        >
          <DonutChart
            className="mt-6 h-60"
            data={chartData}
            category="value"
            index="name"
            colors={colors}
            showAnimation={true}
            showTooltip={true}
            valueFormatter={(value) => t("valueFormatter", { value })}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing, delay: 0.5 }}
        >
          <Legend
            className="mt-4"
            categories={chartData.map((item) => item.name)}
            colors={colors}
          />
        </motion.div>
      </TremorCard>
    </motion.div>
  );
}

