
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaperBid, User } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  ThumbsUp,
  Minus,
  ThumbsDown,
  X,
  User as UserIcon,
  Calendar,
  Target,
} from "lucide-react";

interface BiddingTableProps {
  bids: (PaperBid & { user?: Partial<User> })[];
  loading?: boolean;
}

type BidLevel = "high" | "medium" | "low" | "no_bid";

// Bid level configuration with colors matching requirements
const bidLevelConfig: Record<
  BidLevel,
  { label: string; icon: React.ReactNode; className: string; priority: number }
> = {
  high: {
    label: "High Interest",
    icon: <ThumbsUp className="h-3.5 w-3.5" />,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    priority: 4,
  },
  medium: {
    label: "Medium Interest",
    icon: <Minus className="h-3.5 w-3.5" />,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    priority: 3,
  },
  low: {
    label: "Low Interest",
    icon: <ThumbsDown className="h-3.5 w-3.5" />,
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    priority: 2,
  },
  no_bid: {
    label: "No Bid",
    icon: <X className="h-3.5 w-3.5" />,
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    priority: 1,
  },
};

// Loading skeleton rows
function TableSkeletons() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-28 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function BiddingTable({ bids, loading }: BiddingTableProps) {
  // Sort bids by level (high first) then by date
  const sortedBids = useMemo(() => {
    if (!bids || bids.length === 0) return [];
    return [...bids].sort((a, b) => {
      const priorityA = bidLevelConfig[a.level as BidLevel]?.priority || 0;
      const priorityB = bidLevelConfig[b.level as BidLevel]?.priority || 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      // Secondary sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [bids]);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "??";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Empty state
  if (!loading && sortedBids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Target className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-sm font-medium">No bids submitted</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          No reviewers have submitted bids for this paper yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-medium">
              <span className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Reviewer
              </span>
            </TableHead>
            <TableHead className="font-medium">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Bid Level
              </span>
            </TableHead>
            <TableHead className="font-medium">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableSkeletons />
          ) : (
            sortedBids.map((bid) => {
              const config = bidLevelConfig[bid.level as BidLevel] || bidLevelConfig.no_bid;

              return (
                <TableRow key={bid.id}>
                  {/* Reviewer */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(bid.user?.firstName, bid.user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {bid.user?.firstName || "Unknown"} {bid.user?.lastName || "User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {bid.user?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Bid Level */}
                  <TableCell>
                    <Badge variant="outline" className={config.className}>
                      <span className="flex items-center gap-1.5">
                        {config.icon}
                        {config.label}
                      </span>
                    </Badge>
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(bid.createdAt)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Export for use in other components
export { bidLevelConfig };
export type { BidLevel };

