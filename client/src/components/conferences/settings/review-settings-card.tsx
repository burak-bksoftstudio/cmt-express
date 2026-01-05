import { t } from "@/lib/i18n";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Users, Timer, Info } from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface ReviewSettingsCardProps {
  maxReviewersPerPaper: number;
  assignmentTimeoutDays: number;
  disabled?: boolean;
  onMaxReviewersChange: (value: number) => void;
  onAssignmentTimeoutChange: (value: number) => void;
}

export function ReviewSettingsCard({
  maxReviewersPerPaper,
  assignmentTimeoutDays,
  disabled = false,
  onMaxReviewersChange,
  onAssignmentTimeoutChange,
}: ReviewSettingsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: appleEasing, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Max Reviewers Per Paper */}
          <div className="space-y-2">
            <Label htmlFor="maxReviewers" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {t("fields.maxReviewers.label")}
            </Label>
            <Input
              id="maxReviewers"
              type="number"
              min={1}
              max={10}
              value={maxReviewersPerPaper}
              onChange={(e) => onMaxReviewersChange(parseInt(e.target.value) || 1)}
              disabled={disabled}
              className={disabled ? "bg-muted cursor-not-allowed w-32" : "w-32"}
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{t("fields.maxReviewers.help")}</span>
            </p>
          </div>

          {/* Assignment Timeout Days */}
          <div className="space-y-2">
            <Label htmlFor="assignmentTimeout" className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              {t("fields.timeout.label")}
            </Label>
            <Input
              id="assignmentTimeout"
              type="number"
              min={1}
              max={30}
              value={assignmentTimeoutDays}
              onChange={(e) => onAssignmentTimeoutChange(parseInt(e.target.value) || 7)}
              disabled={disabled}
              className={disabled ? "bg-muted cursor-not-allowed w-32" : "w-32"}
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{t("fields.timeout.help")}</span>
            </p>
          </div>

          {/* Settings Summary */}
          <div className="rounded-lg bg-muted/50 p-4 mt-4">
            <h4 className="text-sm font-medium mb-2">{t("summary.title")}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("summary.reviewersPerPaper")}</p>
                <p className="font-medium">{maxReviewersPerPaper}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("summary.timeout")}</p>
                <p className="font-medium">{t("summary.timeoutValue", { days: assignmentTimeoutDays })}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

