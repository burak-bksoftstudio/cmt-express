import { t } from "@/lib/i18n";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { conferenceApi } from "@/lib/api";
import { ConferenceSettings } from "@/types";
import { Loader2, Save } from "lucide-react";

interface ConferenceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conferenceId: string;
  settings?: ConferenceSettings | null;
  onSuccess?: () => void;
}

export function ConferenceSettingsModal({
  open,
  onOpenChange,
  conferenceId,
  settings,
  onSuccess,
}: ConferenceSettingsModalProps) {
  const [formData, setFormData] = useState({
    submissionDeadline: "",
    reviewDeadline: "",
    maxReviewersPerPaper: 3,
    assignmentTimeoutDays: 7,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (settings) {
      setFormData({
        submissionDeadline: settings.submissionDeadline
          ? new Date(settings.submissionDeadline).toISOString().slice(0, 16)
          : "",
        reviewDeadline: settings.reviewDeadline
          ? new Date(settings.reviewDeadline).toISOString().slice(0, 16)
          : "",
        maxReviewersPerPaper: settings.maxReviewersPerPaper || 3,
        assignmentTimeoutDays: settings.assignmentTimeoutDays || 7,
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await conferenceApi.updateSettings(conferenceId, {
        submissionDeadline: formData.submissionDeadline || undefined,
        reviewDeadline: formData.reviewDeadline || undefined,
        maxReviewersPerPaper: formData.maxReviewersPerPaper,
        assignmentTimeoutDays: formData.assignmentTimeoutDays,
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to update settings";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>{t("errorTitle")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="submissionDeadline">{t("submissionDeadline.label")}</Label>
              <Input
                id="submissionDeadline"
                type="datetime-local"
                value={formData.submissionDeadline}
                onChange={(e) =>
                  setFormData({ ...formData, submissionDeadline: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t("submissionDeadline.help")}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reviewDeadline">{t("reviewDeadline.label")}</Label>
              <Input
                id="reviewDeadline"
                type="datetime-local"
                value={formData.reviewDeadline}
                onChange={(e) =>
                  setFormData({ ...formData, reviewDeadline: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t("reviewDeadline.help")}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxReviewersPerPaper">{t("maxReviewers.label")}</Label>
              <Input
                id="maxReviewersPerPaper"
                type="number"
                min={1}
                max={10}
                value={formData.maxReviewersPerPaper}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxReviewersPerPaper: parseInt(e.target.value) || 3,
                  })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t("maxReviewers.help")}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignmentTimeoutDays">{t("assignmentTimeout.label")}</Label>
              <Input
                id="assignmentTimeoutDays"
                type="number"
                min={1}
                max={30}
                value={formData.assignmentTimeoutDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assignmentTimeoutDays: parseInt(e.target.value) || 7,
                  })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {t("assignmentTimeout.help")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("actions.saving")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("actions.save")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

