
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles, History } from "lucide-react";

interface VersionBadgeProps {
  version: number;
  isLatest: boolean;
  totalVersions: number;
  className?: string;
}

export function VersionBadge({ 
  version, 
  isLatest, 
  totalVersions,
  className 
}: VersionBadgeProps) {
  if (isLatest) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Badge
          className={cn(
            "bg-linear-to-r from-green-500 to-emerald-500 text-white border-0",
            "hover:from-green-600 hover:to-emerald-600",
            "shadow-xs shadow-green-500/20",
            className
          )}
        >
          <Sparkles className="mr-1 h-3 w-3" />
          Latest v{version}
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge
        variant="secondary"
        className={cn(
          "bg-muted text-muted-foreground",
          "hover:bg-muted/80",
          className
        )}
      >
        <History className="mr-1 h-3 w-3" />
        v{version}
      </Badge>
    </motion.div>
  );
}

// Utility function to calculate version numbers for files
export function calculateFileVersions<T extends { id: string; createdAt: string }>(
  files: T[]
): Map<string, { version: number; isLatest: boolean }> {
  // Sort by date (oldest first for version numbering)
  const sortedByDate = [...files].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const versionMap = new Map<string, { version: number; isLatest: boolean }>();
  const totalVersions = sortedByDate.length;

  sortedByDate.forEach((file, index) => {
    versionMap.set(file.id, {
      version: index + 1,
      isLatest: index === totalVersions - 1,
    });
  });

  return versionMap;
}

