import { t } from "@/lib/i18n";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, AlertTriangle } from "lucide-react";

interface ConfirmSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSaving: boolean;
  changes: string[];
  title?: string;
  description?: string;
  warning?: string;
  cancelLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
}

export function ConfirmSaveDialog({
  open,
  onOpenChange,
  onConfirm,
  isSaving,
  changes,
  title,
  description,
  warning,
  cancelLabel,
  saveLabel,
  savingLabel,
}: ConfirmSaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            {title || t("title")}
          </DialogTitle>
          <DialogDescription>
            {description || t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Warning Alert */}
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              {warning || t("warning")}
            </AlertDescription>
          </Alert>

          {/* Changes List */}
          {changes.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium mb-2">{t("changesTitle")}</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {changes.map((change, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {cancelLabel || t("actions.cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {savingLabel || t("actions.saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {saveLabel || t("actions.save")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

