
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewCard } from "./review-card";
import { Review, ReviewerAssignment, User } from "@/types";
import {
  MessageSquare,
  Star,
  Shield,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface ReviewsSectionProps {
  reviews: (Review & { assignment?: ReviewerAssignment & { reviewer?: Partial<User> } })[];
  showReviewer: boolean;
  showFullDetails?: boolean; // If false, only show commentsToAuthor (for authors after decision)
  loading?: boolean;
}

// Loading skeleton for reviews
function ReviewsSkeletons() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReviewsSection({ reviews, showReviewer, showFullDetails = true, loading = false }: ReviewsSectionProps) {
  // Sort reviews by submittedAt DESC (newest first)
  const sortedReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    return [...reviews].sort((a, b) => {
      // Use submittedAt for sorting - Review type only has submittedAt, not createdAt
      const dateA = a.submittedAt || "";
      const dateB = b.submittedAt || "";
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [reviews]);

  // Calculate review statistics (only show if showFullDetails is true)
  const stats = useMemo(() => {
    const submittedReviews = sortedReviews.filter(
      (r) => r.submittedAt !== null && r.submittedAt !== undefined
    );

    // For authors (showFullDetails=false), don't calculate scores
    if (!showFullDetails) {
      return {
        total: sortedReviews.length,
        submitted: submittedReviews.length,
        pending: sortedReviews.length - submittedReviews.length,
        avgScore: null,
        avgConfidence: null,
        recommendations: {},
      };
    }

    const scores = submittedReviews
      .map((r) => r.score)
      .filter((s): s is number => s !== null && s !== undefined);
    const confidences = submittedReviews
      .map((r) => r.confidence)
      .filter((c): c is number => c !== null && c !== undefined);

    const avgScore = scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : null;
    const avgConfidence = confidences.length > 0
      ? (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(1)
      : null;

    // Count recommendations
    const recommendations: Record<string, number> = {};
    submittedReviews.forEach((r) => {
      if (r.recommendation) {
        const key = r.recommendation.toLowerCase();
        recommendations[key] = (recommendations[key] || 0) + 1;
      }
    });

    return {
      total: sortedReviews.length,
      submitted: submittedReviews.length,
      pending: sortedReviews.length - submittedReviews.length,
      avgScore,
      avgConfidence,
      recommendations,
    };
  }, [sortedReviews, showFullDetails]);

  // Empty state
  if (!loading && sortedReviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No reviews yet</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Reviews will appear here once reviewers submit their evaluations for this paper.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reviews
              </CardTitle>
              <CardDescription>
                Reviewer evaluations for this paper
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {stats.submitted}/{stats.total} submitted
              </Badge>
              {stats.pending > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  {stats.pending} pending
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Stats Grid - Only show full stats for chair/admin */}
        {!loading && stats.submitted > 0 && showFullDetails && (
          <>
            <Separator />
            <CardContent className="pt-4">
              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Average Score */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Score</p>
                    <p className="text-xl font-bold">{stats.avgScore || "—"}</p>
                  </div>
                </div>

                {/* Average Confidence */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Confidence</p>
                    <p className="text-xl font-bold">{stats.avgConfidence || "—"}</p>
                  </div>
                </div>

                {/* Submitted Reviews */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold">{stats.submitted}</p>
                  </div>
                </div>

                {/* Recommendation Summary */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recommendations</p>
                    <div className="flex gap-1 mt-1">
                      {Object.entries(stats.recommendations).length > 0 ? (
                        Object.entries(stats.recommendations).map(([rec, count]) => (
                          <Badge
                            key={rec}
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              rec.includes("accept")
                                ? "border-green-300 text-green-600"
                                : rec.includes("reject")
                                ? "border-red-300 text-red-600"
                                : "border-yellow-300 text-yellow-600"
                            }`}
                          >
                            {count}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Loading State */}
      {loading ? (
        <ReviewsSkeletons />
      ) : (
        /* Review Cards */
        <div className="space-y-4">
          {sortedReviews.map((review, index) => (
            <ReviewCard
              key={review.id}
              review={review}
              showReviewer={showReviewer}
              showFullDetails={showFullDetails}
              reviewNumber={sortedReviews.length - index}
            />
          ))}
        </div>
      )}

      {/* Summary Footer - Show simplified for authors */}
      {!loading && stats.submitted > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  <strong>{stats.submitted}</strong> of {stats.total} reviews submitted
                </span>
                {showFullDetails && stats.avgScore && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Average: <strong>{stats.avgScore}</strong>
                  </span>
                )}
              </div>
              {showFullDetails && stats.avgConfidence && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Shield className="h-4 w-4 text-blue-500" />
                  Confidence: <strong>{stats.avgConfidence}</strong>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
