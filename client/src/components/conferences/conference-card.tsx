import { t } from "@/lib/i18n";

import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Conference, ConferenceRole } from "@/types";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Settings, ExternalLink, Users, FileText, Clock, Send } from "lucide-react";

interface ConferenceCardProps {
  conference: Conference;
  userRole?: ConferenceRole["role"] | "admin" | null;
  isAdmin?: boolean;
  isChair?: boolean;
  papersCount?: number;
}

export function ConferenceCard({
  conference,
  userRole,
  isAdmin = false,
  isChair = false,
  papersCount,
}: ConferenceCardProps) {
  const getConferenceStatus = () => {
    const now = new Date();
    const start = new Date(conference.startDate);
    const end = new Date(conference.endDate);

    if (now < start) return { label: t("status.upcoming"), variant: "secondary" as const };
    if (now >= start && now <= end) return { label: t("status.active"), variant: "default" as const };
    return { label: t("status.completed"), variant: "outline" as const };
  };

  const getRoleBadge = () => {
    if (isAdmin) return <Badge variant="destructive">{t("roles.admin")}</Badge>;
    if (userRole === "chair") return <Badge variant="default">{t("roles.chair")}</Badge>;
    if (userRole === "reviewer") return <Badge variant="secondary">{t("roles.reviewer")}</Badge>;
    if (userRole === "author") return <Badge variant="outline">{t("roles.author")}</Badge>;
    return null;
  };

  const status = getConferenceStatus();
  const hasManageAccess = isAdmin || isChair || userRole === "chair";

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="line-clamp-1 text-lg">
              {conference.name}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {conference.description || t("noDescription")}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            {getRoleBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Date and Location Info */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              {formatDate(conference.startDate)} - {formatDate(conference.endDate)}
            </span>
          </div>
          {conference.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{conference.location}</span>
            </div>
          )}
        </div>

        {/* Settings Info */}
        {conference.settings && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
            {conference.settings.submissionDeadline && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("submissionDeadline")}</span>
                <span className="font-medium">{formatDate(conference.settings.submissionDeadline)}</span>
              </div>
            )}
            {conference.settings.reviewDeadline && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("reviewDeadline")}</span>
                <span className="font-medium">{formatDate(conference.settings.reviewDeadline)}</span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {papersCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{t("papersCount", { count: papersCount })}</span>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <div className="border-t p-4">
        <div className="flex flex-col gap-2">
          {/* Submit Paper Button - Primary Action */}
          {status.label !== t("status.completed") && (
            <Link to={`/papers/submit?conferenceId=${conference.id}`} className="w-full">
              <Button className="w-full gap-2" size="sm">
                <Send className="h-4 w-4" />
                Submit Paper
              </Button>
            </Link>
          )}

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Link to={`/conferences/${conference.id}`} className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("viewDetails")}
              </Button>
            </Link>
            {hasManageAccess && (
              <Link to={`/conferences/${conference.id}`}>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

