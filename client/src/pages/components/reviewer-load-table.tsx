

import { t } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useDashboardStore } from "@/stores/dashboard-store";
import { Users, CheckCircle2, Clock } from "lucide-react";

export function ReviewerLoadTable() {
  // translations removed
  const { stats, statsLoading, selectedConferenceId } = useDashboardStore();

  // Placeholder when no conference selected
  if (!selectedConferenceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50" />
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const reviewers = stats?.reviewers || [];

  // Empty state
  if (reviewers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              {t("empty")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>
          {t("subtitleCount", { count: reviewers.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">{t("table.reviewer")}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{t("table.progress")}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">{t("table.assigned")}</th>
                <th className="px-4 py-3 text-center text-sm font-medium">{t("table.completed")}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{t("table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {reviewers.map((reviewer) => {
                const progress =
                  reviewer.assigned > 0
                    ? Math.round((reviewer.completed / reviewer.assigned) * 100)
                    : 0;
                const isComplete = reviewer.assigned > 0 && reviewer.completed === reviewer.assigned;
                const pending = reviewer.assigned - reviewer.completed;

                return (
                  <tr
                    key={reviewer.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {reviewer.firstName?.charAt(0)}
                            {reviewer.lastName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {reviewer.firstName} {reviewer.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {reviewer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2 w-24" />
                        <span className="text-xs text-muted-foreground w-10">
                          {progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline">{reviewer.assigned}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-600"
                      >
                        {reviewer.completed}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isComplete ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {t("table.complete")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          {t("table.pending", { count: pending })}
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

