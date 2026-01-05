import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReviewHeader, ReviewScoreSelect, ReviewTextarea } from "@/components/reviews";
import { reviewApi, ReviewFormData } from "@/lib/api";
import { useSimpleToast } from "@/components/ui/toast";
import {
  Save,
  Send,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Loader2,
} from "lucide-react";

interface ReviewData {
  id: string;
  assignmentId: string;
  status: "not_started" | "draft" | "submitted";
  overallScore?: number;
  confidence?: number;
  summary?: string;
  strengths?: string;
  weaknesses?: string;
  commentsToAuthor?: string;
  commentsToChair?: string;
  paper: {
    id: string;
    title: string;
    abstract?: string;
    conference?: {
      id: string;
      name: string;
    };
    track?: {
      name: string;
    };
    authors?: {
      user?: {
        firstName: string;
        lastName: string;
      };
    }[];
  };
  deadline?: string;
  submittedAt?: string;
}

export default function ReviewDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const reviewId = params.id as string;
  const { addToast, ToastRenderer } = useSimpleToast();

  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ReviewFormData>({
    overallScore: 0,
    confidence: 0,
    summary: "",
    strengths: "",
    weaknesses: "",
    commentsToAuthor: "",
    commentsToChair: "",
  });

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch review data
  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await reviewApi.getById(reviewId);
        const data = response.data?.data;
        if (data) {
          setReview(data);
          setFormData({
            overallScore: data.overallScore || 0,
            confidence: data.confidence || 0,
            summary: data.summary || "",
            strengths: data.strengths || "",
            weaknesses: data.weaknesses || "",
            commentsToAuthor: data.commentsToAuthor || "",
            commentsToChair: data.commentsToChair || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch review:", error);
        addToast({
          type: "error",
          title: "Load Failed",
          description: "Failed to load review",
        });
      } finally {
        setLoading(false);
      }
    };

    if (reviewId) {
      fetchReview();
    }
  }, [reviewId, addToast]);

  const handleSaveDraft = useCallback(async (isAutoSave = false) => {
    if (review?.status === "submitted") return;

    setSaving(true);
    try {
      await reviewApi.saveDraft(reviewId, formData);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      if (!isAutoSave) {
        addToast({
          type: "success",
          title: "Draft Saved",
          description: "Your review has been saved as a draft",
        });
      }
    } catch (error) {
      console.error("Failed to save draft:", error);
      if (!isAutoSave) {
        addToast({
          type: "error",
          title: "Save Failed",
          description: "Failed to save draft",
        });
      }
    } finally {
      setSaving(false);
    }
  }, [review?.status, reviewId, formData, addToast]);

  // Auto-save every 10 seconds when there are changes
  useEffect(() => {
    if (hasUnsavedChanges && review?.status !== "submitted") {
      autoSaveTimer.current = setTimeout(() => {
        handleSaveDraft(true);
      }, 10000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [hasUnsavedChanges, formData, review?.status, handleSaveDraft]);

  const updateFormField = useCallback(
    (field: keyof ReviewFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleSubmit = async () => {
    // Validation
    if (!formData.overallScore || formData.overallScore < 1) {
      addToast({
        type: "error",
        title: "Missing Score",
        description: "Please provide an overall score",
      });
      return;
    }
    if (!formData.confidence || formData.confidence < 1) {
      addToast({
        type: "error",
        title: "Missing Confidence",
        description: "Please provide a confidence level",
      });
      return;
    }
    if (!formData.summary?.trim()) {
      addToast({
        type: "error",
        title: "Missing Summary",
        description: "Please provide a summary",
      });
      return;
    }

    setSubmitting(true);
    try {
      await reviewApi.submit(reviewId, formData);
      addToast({
        type: "success",
        title: "Review Submitted",
        description: "Your review has been submitted successfully",
      });
      setHasUnsavedChanges(false);
      // Update local state
      setReview((prev) => (prev ? { ...prev, status: "submitted" } : null));
      // Redirect after short delay
      setTimeout(() => {
        navigate("/reviews");
      }, 1500);
    } catch (error) {
      console.error("Failed to submit review:", error);
      addToast({
        type: "error",
        title: "Submit Failed",
        description: "Failed to submit review",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = review?.status === "submitted";
  const isOverdue = review?.deadline && new Date(review.deadline) < new Date() && !isSubmitted;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!review) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <h2 className="mt-4 text-xl font-semibold">Review Not Found</h2>
          <p className="text-muted-foreground">
            The review you're looking for doesn't exist
          </p>
          <Link to="/reviews">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reviews
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-32">
        {/* Back button and status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Link to="/reviews">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Reviews
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {isSubmitted && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="mr-1 h-3 w-3" />
                Submitted
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive">
                <Clock className="mr-1 h-3 w-3 animate-pulse" />
                Overdue
              </Badge>
            )}
            {lastSaved && !isSubmitted && (
              <span className="text-xs text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </motion.div>

        {/* Paper Header */}
        <ReviewHeader paper={review.paper as any} deadline={review.deadline} />

        {/* Submitted notice */}
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Alert className="mt-6 border-green-500/50 bg-green-50/50 dark:bg-green-900/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                This review has been submitted and cannot be edited.
                {review.submittedAt && (
                  <span className="block mt-1 text-sm">
                    Submitted on: {new Date(review.submittedAt).toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Review Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 space-y-6"
        >
          {/* Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <ReviewScoreSelect
                type="score"
                value={formData.overallScore}
                onChange={(v) => updateFormField("overallScore", v)}
                disabled={isSubmitted}
              />
              <ReviewScoreSelect
                type="confidence"
                value={formData.confidence}
                onChange={(v) => updateFormField("confidence", v)}
                disabled={isSubmitted}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewTextarea
                id="summary"
                label="Summary"
                value={formData.summary || ""}
                onChange={(v) => updateFormField("summary", v)}
                placeholder="Provide a brief summary of your review"
                description="Summarize your overall assessment of the paper"
                required
                disabled={isSubmitted}
                maxLength={2000}
              />
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-green-600 dark:text-green-400">
                  <ThumbsUp className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewTextarea
                  id="strengths"
                  label="Strengths"
                  value={formData.strengths || ""}
                  onChange={(v) => updateFormField("strengths", v)}
                  placeholder="List the main strengths of the paper"
                  description="What are the positive aspects of this work?"
                  disabled={isSubmitted}
                  maxLength={1500}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
                  <ThumbsDown className="h-5 w-5" />
                  Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewTextarea
                  id="weaknesses"
                  label="Weaknesses"
                  value={formData.weaknesses || ""}
                  onChange={(v) => updateFormField("weaknesses", v)}
                  placeholder="List the main weaknesses of the paper"
                  description="What aspects need improvement?"
                  disabled={isSubmitted}
                  maxLength={1500}
                />
              </CardContent>
            </Card>
          </div>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" />
                Comments to Author
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewTextarea
                id="commentsToAuthor"
                label="Comments to Author"
                value={formData.commentsToAuthor || ""}
                onChange={(v) => updateFormField("commentsToAuthor", v)}
                placeholder="Provide detailed feedback for the authors"
                description="These comments will be shared with the authors"
                disabled={isSubmitted}
                maxLength={3000}
              />
            </CardContent>
          </Card>

          {/* Confidential Comments */}
          <Card className="border-orange-200 dark:border-orange-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Confidential Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewTextarea
                id="commentsToChair"
                label="Comments to Chair"
                value={formData.commentsToChair || ""}
                onChange={(v) => updateFormField("commentsToChair", v)}
                placeholder="Provide confidential comments for the program chair"
                description="These comments will only be visible to the program chair"
                disabled={isSubmitted}
                maxLength={1500}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Sticky Action Bar */}
        {!isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60"
          >
            <div className="max-w-4xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {hasUnsavedChanges && (
                    <span className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Unsaved changes
                    </span>
                  )}
                  {saving && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSaveDraft(false)}
                    disabled={saving || submitting}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Draft
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={saving || submitting}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit Review
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <ToastRenderer />
    </DashboardLayout>
  );
}
