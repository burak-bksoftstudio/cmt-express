
import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewerRow } from "./reviewer-row";
import { ReviewerAssignment, User, PaperBid, ReviewerConflict } from "@/types";
import { Search, Users, Filter } from "lucide-react";

interface ReviewerData {
  reviewer: Partial<User>;
  assignment?: ReviewerAssignment;
  bid?: PaperBid;
  hasConflict?: boolean;
}

interface ReviewerListProps {
  reviewers: ReviewerData[];
  canManage: boolean;
  onAssign: (reviewerId: string) => Promise<void>;
  onUnassign: (assignmentId: string) => Promise<void>;
}

type FilterOption = "all" | "assigned" | "unassigned" | "with-bid" | "no-conflict";

export function ReviewerList({
  reviewers,
  canManage,
  onAssign,
  onUnassign,
}: ReviewerListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("all");

  // Filter and search reviewers
  const filteredReviewers = useMemo(() => {
    let result = reviewers;

    // Apply search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.reviewer.firstName?.toLowerCase().includes(searchLower) ||
          r.reviewer.lastName?.toLowerCase().includes(searchLower) ||
          r.reviewer.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filter
    switch (filter) {
      case "assigned":
        result = result.filter((r) => !!r.assignment);
        break;
      case "unassigned":
        result = result.filter((r) => !r.assignment);
        break;
      case "with-bid":
        result = result.filter((r) => r.bid && r.bid.level !== "no_bid");
        break;
      case "no-conflict":
        result = result.filter((r) => !r.hasConflict);
        break;
    }

    // Sort: assigned first, then by bid level, then alphabetically
    const bidPriority: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
      no_bid: 3,
    };

    result.sort((a, b) => {
      // Assigned first
      if (a.assignment && !b.assignment) return -1;
      if (!a.assignment && b.assignment) return 1;

      // Conflicts last
      if (a.hasConflict && !b.hasConflict) return 1;
      if (!a.hasConflict && b.hasConflict) return -1;

      // By bid level
      const bidA = a.bid?.level ? bidPriority[a.bid.level] ?? 4 : 4;
      const bidB = b.bid?.level ? bidPriority[b.bid.level] ?? 4 : 4;
      if (bidA !== bidB) return bidA - bidB;

      // Alphabetically
      const nameA = `${a.reviewer.firstName} ${a.reviewer.lastName}`.toLowerCase();
      const nameB = `${b.reviewer.firstName} ${b.reviewer.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [reviewers, search, filter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: reviewers.length,
      assigned: reviewers.filter((r) => !!r.assignment).length,
      withBid: reviewers.filter((r) => r.bid && r.bid.level !== "no_bid").length,
      conflicts: reviewers.filter((r) => r.hasConflict).length,
    };
  }, [reviewers]);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviewers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter */}
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviewers</SelectItem>
            <SelectItem value="assigned">Assigned Only</SelectItem>
            <SelectItem value="unassigned">Unassigned Only</SelectItem>
            <SelectItem value="with-bid">With Bids</SelectItem>
            <SelectItem value="no-conflict">No Conflicts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline" className="font-normal">
          <Users className="h-3 w-3 mr-1" />
          {stats.total} total
        </Badge>
        <Badge variant="secondary" className="font-normal">
          {stats.assigned} assigned
        </Badge>
        {stats.withBid > 0 && (
          <Badge variant="outline" className="font-normal text-green-600 border-green-200">
            {stats.withBid} with bids
          </Badge>
        )}
        {stats.conflicts > 0 && (
          <Badge variant="outline" className="font-normal text-red-600 border-red-200">
            {stats.conflicts} conflicts
          </Badge>
        )}
      </div>

      {/* Reviewer List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredReviewers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No reviewers found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? "Try adjusting your search"
                  : "No reviewers match the current filter"}
              </p>
            </div>
          ) : (
            filteredReviewers.map((data, index) => (
              <ReviewerRow
                key={data.reviewer.id || index}
                reviewer={data.reviewer}
                assignment={data.assignment}
                bid={data.bid}
                hasConflict={data.hasConflict}
                canManage={canManage}
                onAssign={onAssign}
                onUnassign={onUnassign}
                index={index}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

