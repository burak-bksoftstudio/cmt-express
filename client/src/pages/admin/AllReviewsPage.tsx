import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
  User,
  Calendar,
  ExternalLink,
  Filter
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

interface Review {
  id: string;
  overallScore: number;
  confidence: number;
  submittedAt?: string;
  assignment: {
    id: string;
    paper: {
      id: string;
      title: string;
      conference: {
        id: string;
        name: string;
      };
    };
    reviewer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function AllReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = reviews.filter((review) =>
        review.assignment.paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.assignment.paper.conference.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${review.assignment.reviewer.firstName} ${review.assignment.reviewer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReviews(filtered);
    } else {
      setFilteredReviews(reviews);
    }
  }, [searchQuery, reviews]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // This endpoint needs to be created in backend
      const response = await api.get("/admin/reviews");
      setReviews(response.data.data || []);
      setFilteredReviews(response.data.data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
      // For now, show empty state
      setReviews([]);
      setFilteredReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">All Reviews</h1>
            <p className="text-muted-foreground mt-1">
              View all submitted reviews across all conferences
            </p>
          </div>
          <Badge variant="secondary">
            {filteredReviews.length} Reviews
          </Badge>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by paper title, conference, or reviewer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading reviews...
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reviews Found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No reviews match your search criteria"
                  : "No reviews have been submitted yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">
                        {review.assignment.paper.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">
                          {review.assignment.paper.conference.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-2xl font-bold ${getScoreColor(review.overallScore)}`}>
                        {review.overallScore}/10
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Confidence: {review.confidence}/5
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>
                        {review.assignment.reviewer.firstName} {review.assignment.reviewer.lastName}
                      </span>
                    </div>
                    {review.submittedAt && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateTime(review.submittedAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/papers/${review.assignment.paper.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Paper
                    </Button>
                    <Button
                      onClick={() => navigate(`/reviews/${review.id}`)}
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
