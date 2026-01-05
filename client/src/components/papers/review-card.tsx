
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Review, User } from "@/types";
import { formatDateTime } from "@/lib/utils";
import {
  Star,
  Shield,
  MessageSquare,
  User as UserIcon,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertCircle,
} from "lucide-react";

interface ReviewCardProps {
  review: Review & {
    assignment?: {
      reviewer?: Partial<User>;
    };
  };
  showReviewer?: boolean;
  showFullDetails?: boolean; // If false, only show commentsToAuthor (for authors after decision)
  reviewNumber?: number;
}

// Recommendation configuration
const recommendationConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  accept: {
    label: "Accept",
    icon: <ThumbsUp className="h-3 w-3" />,
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  strong_accept: {
    label: "Strong Accept",
    icon: <ThumbsUp className="h-3 w-3" />,
    className: "bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700",
  },
  weak_accept: {
    label: "Weak Accept",
    icon: <ThumbsUp className="h-3 w-3" />,
    className: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-500 border-green-100 dark:border-green-900",
  },
  borderline: {
    label: "Borderline",
    icon: <Minus className="h-3 w-3" />,
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  weak_reject: {
    label: "Weak Reject",
    icon: <ThumbsDown className="h-3 w-3" />,
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  reject: {
    label: "Reject",
    icon: <ThumbsDown className="h-3 w-3" />,
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  strong_reject: {
    label: "Strong Reject",
    icon: <ThumbsDown className="h-3 w-3" />,
    className: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-300 dark:border-red-700",
  },
};

// Score color configuration
const getScoreConfig = (score: number | null | undefined) => {
  if (score === null || score === undefined) {
    return {
      className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      label: "Not submitted",
    };
  }
  if (score >= 3) {
    return {
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      label: `${score}/3`,
    };
  }
  if (score === 2) {
    return {
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      label: `${score}/3`,
    };
  }
  return {
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    label: `${score}/3`,
  };
};

// Confidence color configuration
const getConfidenceConfig = (confidence: number | null | undefined) => {
  if (confidence === null || confidence === undefined) {
    return {
      className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      label: "N/A",
      description: "Not specified",
    };
  }
  if (confidence >= 3) {
    return {
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      label: `${confidence}/5`,
      description: "High confidence",
    };
  }
  if (confidence === 2) {
    return {
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      label: `${confidence}/5`,
      description: "Medium confidence",
    };
  }
  return {
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    label: `${confidence}/5`,
    description: "Low confidence",
  };
};

export function ReviewCard({ review, showReviewer = true, showFullDetails = true, reviewNumber }: ReviewCardProps) {
  const reviewer = review.assignment?.reviewer;
  // Only show recommendation badge for chair/admin (showFullDetails=true)
  const recommendation = showFullDetails && review.recommendation
    ? recommendationConfig[review.recommendation.toLowerCase()] || null
    : null;
  const scoreConfig = getScoreConfig(review.score);
  const confidenceConfig = getConfidenceConfig(review.confidence);
  const isSubmitted = review.submittedAt !== null && review.submittedAt !== undefined;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "??";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <Card className={`transition-all ${!isSubmitted ? "opacity-70 border-dashed" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Reviewer Info */}
          <div className="flex items-center gap-3">
            {reviewNumber && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                #{reviewNumber}
              </div>
            )}
            {showReviewer && reviewer ? (
              <>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(reviewer.firstName, reviewer.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {reviewer.firstName} {reviewer.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{reviewer.email}</p>
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-muted-foreground">Anonymous Reviewer</p>
                  <p className="text-sm text-muted-foreground">
                    {reviewNumber ? `Review #${reviewNumber}` : "Review"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {!isSubmitted && (
              <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <AlertCircle className="mr-1 h-3 w-3" />
                Pending
              </Badge>
            )}
            {recommendation && (
              <Badge variant="outline" className={recommendation.className}>
                {recommendation.icon}
                <span className="ml-1">{recommendation.label}</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score & Confidence Cards - Only show for chair/admin */}
        {showFullDetails && (
          <div className="grid grid-cols-2 gap-3">
            {/* Score */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${scoreConfig.className}`}>
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-lg font-bold">
                  {review.score !== null && review.score !== undefined ? review.score : "—"}
                </p>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${confidenceConfig.className}`}>
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-lg font-bold">
                  {review.confidence !== null && review.confidence !== undefined ? review.confidence : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comments to Author - Always visible after decision */}
        {review.commentsToAuthor && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>Comments to Author</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {review.commentsToAuthor}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Full Review Details - Only for chair/admin */}
        {showFullDetails && (
          <>
            {/* Summary */}
            {review.summary && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>Summary</span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {review.summary}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Strengths */}
            {review.strengths && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Strengths</span>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {review.strengths}
                  </p>
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {review.weaknesses && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <ThumbsDown className="h-4 w-4" />
                  <span>Weaknesses</span>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {review.weaknesses}
                  </p>
                </div>
              </div>
            )}

            {/* Comments to Chair - Only visible to chair */}
            {review.commentsToChair && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <Shield className="h-4 w-4" />
                  <span>Comments to Chair (Confidential)</span>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {review.commentsToChair}
                  </p>
                </div>
              </div>
            )}

            {/* Legacy comment field */}
            {review.comment && !review.commentsToAuthor && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>Review Comments</span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* No comments state for authors */}
        {!showFullDetails && !review.commentsToAuthor && isSubmitted && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <MessageSquare className="h-4 w-4" />
              <span className="italic">No comments to author provided</span>
            </div>
          </>
        )}

        {/* Submitted Date */}
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {isSubmitted
              ? `Submitted: ${formatDateTime(review.submittedAt!)}`
              : "Not yet submitted"}
          </span>
          {showFullDetails && review.score !== null && review.confidence !== null && (
            <span>
              Score: {review.score} / Confidence: {review.confidence}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
