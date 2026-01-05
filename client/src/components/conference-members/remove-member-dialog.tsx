import { t } from "@/lib/i18n";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConferenceMember } from "@/types";
import { Loader2 } from "lucide-react";

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: ConferenceMember | null;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  onConfirm,
  loading,
}: RemoveMemberDialogProps) {
  if (!member) return null;

  const fullName = member.user
    ? `${member.user.firstName} ${member.user.lastName}`
    : t("fallbackName");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich("description", { name: fullName, strong: (chunks: React.ReactNode) => <strong>{chunks}</strong> })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("actions.loading")}
              </>
            ) : (
              t("actions.confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

