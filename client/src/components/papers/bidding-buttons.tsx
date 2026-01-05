
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { biddingApi, BidValue } from "@/lib/api";
import {
  Loader2,
  ThumbsUp,
  Minus,
  ThumbsDown,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export type BidLevel = "high" | "medium" | "low" | "no_bid";

// Map component BidLevel to API BidValue
const bidLevelToValue: Record<BidLevel, BidValue> = {
  high: "YES",
  medium: "MAYBE",
  low: "NO",
  no_bid: "CONFLICT",
};

interface BiddingButtonsProps {
  paperId: string;
  currentBid?: BidLevel | null;
  onBidChange?: (level: BidLevel) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

const bidConfig: Record<
  BidLevel,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
    activeClassName: string;
    description: string;
  }
> = {
  high: {
    label: "High",
    icon: <ThumbsUp className="h-4 w-4" />,
    className:
      "border-green-200 hover:border-green-400 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/50",
    activeClassName:
      "border-green-500 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 ring-2 ring-green-500/20",
    description: "Very interested in reviewing",
  },
  medium: {
    label: "Medium",
    icon: <Minus className="h-4 w-4" />,
    className:
      "border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/50",
    activeClassName:
      "border-blue-500 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 ring-2 ring-blue-500/20",
    description: "Moderately interested",
  },
  low: {
    label: "Low",
    icon: <ThumbsDown className="h-4 w-4" />,
    className:
      "border-yellow-200 hover:border-yellow-400 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-950/50",
    activeClassName:
      "border-yellow-500 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 ring-2 ring-yellow-500/20",
    description: "Low interest",
  },
  no_bid: {
    label: "No Bid",
    icon: <X className="h-4 w-4" />,
    className:
      "border-gray-200 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900",
    activeClassName:
      "border-gray-500 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 ring-2 ring-gray-500/20",
    description: "Not interested",
  },
};

const bidOrder: BidLevel[] = ["high", "medium", "low", "no_bid"];

export function BiddingButtons({
  paperId,
  currentBid,
  onBidChange,
  onSuccess,
  onError,
  disabled = false,
}: BiddingButtonsProps) {
  const [loading, setLoading] = useState<BidLevel | null>(null);
  const [activeBid, setActiveBid] = useState<BidLevel | null>(currentBid || null);

  const handleBid = useCallback(
    async (level: BidLevel) => {
      if (disabled || loading) return;

      // Don't do anything if clicking the already selected bid
      if (activeBid === level) return;

      setLoading(level);
      try {
        await biddingApi.submitBid(paperId, bidLevelToValue[level]);
        setActiveBid(level);
        onBidChange?.(level);
        onSuccess?.(`Bid set to "${bidConfig[level].label}"`);
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to submit bid";
        onError?.(message);
        console.error("Failed to set bid:", error);
      } finally {
        setLoading(null);
      }
    },
    [paperId, activeBid, disabled, loading, onBidChange, onSuccess, onError]
  );

  return (
    <div className="space-y-4">
      {/* Button Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {bidOrder.map((level) => {
          const config = bidConfig[level];
          const isActive = activeBid === level;
          const isLoading = loading === level;

          return (
            <Button
              key={level}
              variant="outline"
              size="default"
              disabled={disabled || loading !== null}
              onClick={() => handleBid(level)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-3 transition-all",
                isActive ? config.activeClassName : config.className
              )}
            >
              <span className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  config.icon
                )}
                <span className="font-medium">{config.label}</span>
              </span>
            </Button>
          );
        })}
      </div>

      {/* Current Selection Info */}
      {activeBid && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>
            Your current bid: <strong>{bidConfig[activeBid].label}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

// Export bid level type for use in other components
export { bidConfig, bidOrder };
