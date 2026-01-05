
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReviewerAssignment, User, PaperBid } from "@/types";
import {
  UserPlus,
  UserMinus,
  Loader2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
} from "lucide-react";

interface ReviewerRowProps {
  reviewer: Partial<User>;
  assignment?: ReviewerAssignment;
  bid?: PaperBid;
  hasConflict?: boolean;
  canManage: boolean;
  onAssign: (reviewerId: string) => Promise<void>;
  onUnassign: (assignmentId: string) => Promise<void>;
  index: number;
}

// Bid level config
const bidConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  high: {
    label: "High Interest",
    icon: ThumbsUp,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  medium: {
    label: "Medium",
    icon: Minus,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  low: {
    label: "Low Interest",
    icon: ThumbsDown,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  no_bid: {
    label: "No Bid",
    icon: Minus,
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

// Assignment status config
const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  completed: {
    label: "Review Submitted",
    icon: Send,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

export function ReviewerRow({
  reviewer,
  assignment,
  bid,
  hasConflict,
  canManage,
  onAssign,
  onUnassign,
  index,
}: ReviewerRowProps) {
  const [loading, setLoading] = useState(false);

  const isAssigned = !!assignment;
  const initials = reviewer.firstName && reviewer.lastName
    ? `${reviewer.firstName[0]}${reviewer.lastName[0]}`
    : "?";

  const handleAction = async () => {
    if (!canManage) return;
    
    setLoading(true);
    try {
      if (isAssigned && assignment) {
        await onUnassign(assignment.id);
      } else if (reviewer.id) {
        await onAssign(reviewer.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const bidInfo = bid ? bidConfig[bid.level] || bidConfig.no_bid : null;
  const statusInfo = assignment ? statusConfig[assignment.status] || statusConfig.pending : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={`group flex items-center gap-4 rounded-lg border p-3 transition-all hover:bg-accent/50 ${
        hasConflict ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20" : ""
      } ${isAssigned ? "border-primary/30 bg-primary/5" : ""}`}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Reviewer Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {reviewer.firstName} {reviewer.lastName}
          </p>
          {isAssigned && (
            <Badge variant="outline" className="text-xs shrink-0">
              Assigned
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {reviewer.email}
        </p>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Conflict Badge */}
        {hasConflict && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Conflict
          </Badge>
        )}

        {/* Bid Badge */}
        {bidInfo && (
          <Badge className={`gap-1 ${bidInfo.color}`}>
            <bidInfo.icon className="h-3 w-3" />
            {bidInfo.label}
          </Badge>
        )}

        {/* Assignment Status Badge */}
        {statusInfo && (
          <Badge className={`gap-1 ${statusInfo.color}`}>
            <statusInfo.icon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        )}
      </div>

      {/* Action Button */}
      {canManage && !hasConflict && (
        <Button
          variant={isAssigned ? "outline" : "default"}
          size="sm"
          onClick={handleAction}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isAssigned ? (
            <>
              <UserMinus className="h-4 w-4 mr-1" />
              Unassign
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              Assign
            </>
          )}
        </Button>
      )}

      {/* Conflict - disabled state */}
      {canManage && hasConflict && (
        <Button variant="outline" size="sm" disabled className="shrink-0 opacity-50">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Conflict
        </Button>
      )}
    </motion.div>
  );
}

