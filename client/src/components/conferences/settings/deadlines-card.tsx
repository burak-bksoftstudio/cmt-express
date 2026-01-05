import { t } from "@/lib/i18n";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Send, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface DeadlinesCardProps {
  submissionDeadline: string;
  reviewDeadline: string;
  disabled?: boolean;
  onSubmissionDeadlineChange: (value: string) => void;
  onReviewDeadlineChange: (value: string) => void;
}

export function DeadlinesCard({
  submissionDeadline,
  reviewDeadline,
  disabled = false,
  onSubmissionDeadlineChange,
  onReviewDeadlineChange,
}: DeadlinesCardProps) {
  // Format date for datetime-local input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  // Calculate deadline status
  const getDeadlineStatus = (deadline: string) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return {
        label: t("status.passed"),
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      };
    }
    if (diffDays <= 3) {
      return {
        label: t("status.left", { count: diffDays }),
        icon: <AlertCircle className="h-3 w-3" />,
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      };
    }
    if (diffDays <= 7) {
      return {
        label: t("status.left", { count: diffDays }),
        icon: <Clock className="h-3 w-3" />,
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      };
    }
    return {
      label: t("status.left", { count: diffDays }),
      icon: <Clock className="h-3 w-3" />,
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
  };

  const submissionStatus = getDeadlineStatus(submissionDeadline);
  const reviewStatus = getDeadlineStatus(reviewDeadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: appleEasing, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
              {t("title")}
          </CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Submission Deadline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="submissionDeadline" className="flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                  {t("fields.submission.label")}
              </Label>
              {submissionStatus && (
                <Badge variant="outline" className={submissionStatus.className}>
                  {submissionStatus.icon}
                  <span className="ml-1">{submissionStatus.label}</span>
                </Badge>
              )}
            </div>
            <Input
              id="submissionDeadline"
              type="datetime-local"
              value={formatDateForInput(submissionDeadline)}
              onChange={(e) => onSubmissionDeadlineChange(e.target.value)}
              disabled={disabled}
              className={disabled ? "bg-muted cursor-not-allowed" : ""}
            />
            <p className="text-xs text-muted-foreground">
                  {t("fields.submission.help")}
            </p>
          </div>

          {/* Review Deadline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reviewDeadline" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    {t("fields.review.label")}
              </Label>
              {reviewStatus && (
                <Badge variant="outline" className={reviewStatus.className}>
                  {reviewStatus.icon}
                  <span className="ml-1">{reviewStatus.label}</span>
                </Badge>
              )}
            </div>
            <Input
              id="reviewDeadline"
              type="datetime-local"
              value={formatDateForInput(reviewDeadline)}
              onChange={(e) => onReviewDeadlineChange(e.target.value)}
              disabled={disabled}
              className={disabled ? "bg-muted cursor-not-allowed" : ""}
            />
            <p className="text-xs text-muted-foreground">
                  {t("fields.review.help")}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

