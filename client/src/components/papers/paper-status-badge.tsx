
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PaperStatus = "submitted" | "under_review" | "accepted" | "rejected" | "revision";

interface PaperStatusBadgeProps {
  status: PaperStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  submitted: {
    label: "Submitted",
    variant: "secondary",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100",
  },
  under_review: {
    label: "Under Review",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100",
  },
  accepted: {
    label: "Accepted",
    variant: "secondary",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100",
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100",
  },
  revision: {
    label: "Revision Required",
    variant: "secondary",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100",
  },
};

export function PaperStatusBadge({ status, className }: PaperStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, " "),
    variant: "outline" as const,
    className: "",
  };

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

