
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSimpleToast } from "@/components/ui/toast";
import { biddingApi, BidValue } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ThumbsUp,
  HelpCircle,
  ThumbsDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface BiddingButtonsProps {
  paperId: string;
  currentBid?: BidValue | null;
  onBidChange?: (bid: BidValue) => void;
  disabled?: boolean;
  compact?: boolean;
}

const bidConfig: Record<
  BidValue,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    activeColor: string;
    hoverColor: string;
  }
> = {
  YES: {
    label: "Yes",
    icon: ThumbsUp,
    color: "text-green-600 dark:text-green-400",
    activeColor: "bg-green-600 text-white hover:bg-green-700",
    hoverColor: "hover:bg-green-100 dark:hover:bg-green-900/30",
  },
  MAYBE: {
    label: "Maybe",
    icon: HelpCircle,
    color: "text-yellow-600 dark:text-yellow-400",
    activeColor: "bg-yellow-500 text-white hover:bg-yellow-600",
    hoverColor: "hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
  },
  NO: {
    label: "No",
    icon: ThumbsDown,
    color: "text-gray-600 dark:text-gray-400",
    activeColor: "bg-gray-600 text-white hover:bg-gray-700",
    hoverColor: "hover:bg-gray-100 dark:hover:bg-gray-800",
  },
  CONFLICT: {
    label: "Conflict",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    activeColor: "bg-red-600 text-white hover:bg-red-700",
    hoverColor: "hover:bg-red-100 dark:hover:bg-red-900/30",
  },
};

export function BiddingButtons({
  paperId,
  currentBid,
  onBidChange,
  disabled = false,
  compact = false,
}: BiddingButtonsProps) {
  const [selectedBid, setSelectedBid] = useState<BidValue | null>(currentBid || null);
  const [loading, setLoading] = useState<BidValue | null>(null);
  const { addToast, ToastRenderer } = useSimpleToast();

  const handleBid = async (bid: BidValue) => {
    if (disabled || loading) return;

    setLoading(bid);
    try {
      await biddingApi.submitBid(paperId, bid);
      setSelectedBid(bid);
      onBidChange?.(bid);
      addToast({
        type: "success",
        title: "Bid submitted",
        description: `Your bid "${bid}" has been recorded.`,
      });
    } catch (error) {
      console.error("Failed to submit bid:", error);
      addToast({
        type: "error",
        title: "Failed to submit bid",
        description: "Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  const bidValues: BidValue[] = ["YES", "MAYBE", "NO", "CONFLICT"];

  return (
    <>
      <div className={cn("flex gap-2", compact ? "flex-wrap" : "flex-col sm:flex-row")}>
        {bidValues.map((bid) => {
          const config = bidConfig[bid];
          const Icon = config.icon;
          const isActive = selectedBid === bid;
          const isLoading = loading === bid;

          return (
            <motion.div
              key={bid}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
            >
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                disabled={disabled || loading !== null}
                onClick={() => handleBid(bid)}
                className={cn(
                  "relative transition-all duration-200",
                  compact ? "px-3" : "min-w-[100px]",
                  isActive
                    ? config.activeColor
                    : cn("border-border", config.hoverColor, config.color)
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className={cn("h-4 w-4", !compact && "mr-2")} />
                )}
                {!compact && <span>{config.label}</span>}
                {isActive && !isLoading && (
                  <motion.div
                    layoutId={`bid-indicator-${paperId}`}
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white border-2 border-current"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
      <ToastRenderer />
    </>
  );
}

