import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSimpleToast } from "@/components/ui/toast";
import { metareviewApi, paperApi, MetareviewFormData, MetareviewData } from "@/lib/api";
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
  Star,
} from "lucide-react";

interface PaperData {
  id: string;
  title: string;
  abstract?: string;
  conference?: {
    id: string;
    name: string;
  };
}

export default function MetareviewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const paperId = params.paperId as string;
  const { addToast, ToastRenderer } = useSimpleToast();

  const [paper, setPaper] = useState<PaperData | null>(null);
  const [metareview, setMetareview] = useState<MetareviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<MetareviewFormData>({
    summary: "",
    strengths: "",
    weaknesses: "",
    recommendation: "BORDERLINE",
    confidence: 3,
    reviewConsensus: true,
    disagreementNote: "",
  });

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch paper and metareview data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch paper
        const paperResponse = await paperApi.getById(paperId);
        const paperData = paperResponse.data?.data;
        if (paperData) {
          setPaper(paperData);
        }

        // Try to fetch existing metareview
        try {
          const metareviewResponse = await metareviewApi.getByPaper(paperId);
          const metareviewData = metareviewResponse.data?.data;
          if (metareviewData) {
            setMetareview(metareviewData);
            setFormData({
              summary: metareviewData.summary || "",
              strengths: metareviewData.strengths || "",
              weaknesses: metareviewData.weaknesses || "",
              recommendation: metareviewData.recommendation || "BORDERLINE",
              confidence: metareviewData.confidence || 3,
              reviewConsensus: metareviewData.reviewConsensus ?? true,
              disagreementNote: metareviewData.disagreementNote || "",
            });
          }
        } catch (error: any) {
          // Metareview doesn't exist yet, that's okay
          if (error.response?.status !== 404) {
            console.error("Failed to fetch metareview:", error);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        addToast({
          type: "error",
          title: "Load Failed",
          description: "Failed to load paper data",
        });
      } finally {
        setLoading(false);
      }
    };

    if (paperId) {
      fetchData();
    }
  }, [paperId, addToast]);

  const handleSaveDraft = useCallback(
    async (isAutoSave = false) => {
      if (metareview?.submittedAt) return;

      setSaving(true);
      try {
        if (metareview) {
          // Update existing metareview
          await metareviewApi.update(metareview.id, formData);
        } else {
          // Create new metareview
          const response = await metareviewApi.create(paperId, formData);
          const newMetareview = response.data?.data;
          if (newMetareview) {
            setMetareview(newMetareview);
          }
        }
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        if (!isAutoSave) {
          addToast({
            type: "success",
            title: "Draft Saved",
            description: "Your metareview has been saved as a draft",
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
    },
    [metareview, paperId, formData, addToast]
  );

  // Auto-save every 10 seconds when there are changes
  useEffect(() => {
    if (hasUnsavedChanges && !metareview?.submittedAt) {
      autoSaveTimer.current = setTimeout(() => {
        handleSaveDraft(true);
      }, 10000);
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [hasUnsavedChanges, formData, metareview?.submittedAt, handleSaveDraft]);

  const updateFormField = useCallback(
    <K extends keyof MetareviewFormData>(field: K, value: MetareviewFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setHasUnsavedChanges(true);
    },
    []
  );

  const handleSubmit = async () => {
    // Validation
    if (!formData.summary?.trim()) {
      addToast({
        type: "error",
        title: "Missing Summary",
        description: "Please provide a summary",
      });
      return;
    }
    if (!formData.strengths?.trim()) {
      addToast({
        type: "error",
        title: "Missing Strengths",
        description: "Please provide strengths",
      });
      return;
    }
    if (!formData.weaknesses?.trim()) {
      addToast({
        type: "error",
        title: "Missing Weaknesses",
        description: "Please provide weaknesses",
      });
      return;
    }
    if (!formData.recommendation) {
      addToast({
        type: "error",
        title: "Missing Recommendation",
        description: "Please select a recommendation",
      });
      return;
    }
    if (formData.confidence < 1 || formData.confidence > 5) {
      addToast({
        type: "error",
        title: "Invalid Confidence",
        description: "Confidence must be between 1 and 5",
      });
      return;
    }

    // Save draft first if not saved
    if (!metareview && hasUnsavedChanges) {
      await handleSaveDraft(false);
    }

    setSubmitting(true);
    try {
      if (metareview) {
        await metareviewApi.submit(metareview.id);
        addToast({
          type: "success",
          title: "Metareview Submitted",
          description: "Your metareview has been submitted successfully",
        });
        setHasUnsavedChanges(false);
        // Update local state
        setMetareview((prev) => (prev ? { ...prev, submittedAt: new Date().toISOString() } : null));
        // Redirect after short delay
        setTimeout(() => {
          navigate(`/papers/${paperId}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error("Failed to submit metareview:", error);
      addToast({
        type: "error",
        title: "Submit Failed",
        description: error.response?.data?.message || "Failed to submit metareview",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = !!metareview?.submittedAt;

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

  if (!paper) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <h2 className="mt-4 text-xl font-semibold">Paper Not Found</h2>
          <p className="text-muted-foreground">The paper you're looking for doesn't exist</p>
          <Link to="/papers">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Papers
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
          <Link to={`/papers/${paperId}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Paper
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {isSubmitted && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="mr-1 h-3 w-3" />
                Submitted
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{paper.title}</CardTitle>
                  {paper.conference && (
                    <p className="text-sm text-muted-foreground">{paper.conference.name}</p>
                  )}
                </div>
                <Badge variant="outline" className="ml-4">
                  <Star className="h-3 w-3 mr-1" />
                  Meta-review
                </Badge>
              </div>
            </CardHeader>
            {paper.abstract && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{paper.abstract}</p>
              </CardContent>
            )}
          </Card>
        </motion.div>

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
                This metareview has been submitted and cannot be edited.
                {metareview?.submittedAt && (
                  <span className="block mt-1 text-sm">
                    Submitted on: {new Date(metareview.submittedAt).toLocaleString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Metareview Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 space-y-6"
        >
          {/* Recommendation & Confidence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="recommendation">
                  Decision Recommendation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.recommendation}
                  onValueChange={(value) =>
                    updateFormField("recommendation", value as "ACCEPT" | "REJECT" | "BORDERLINE")
                  }
                  disabled={isSubmitted}
                >
                  <SelectTrigger id="recommendation">
                    <SelectValue placeholder="Select recommendation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCEPT">Accept</SelectItem>
                    <SelectItem value="BORDERLINE">Borderline</SelectItem>
                    <SelectItem value="REJECT">Reject</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Your final recommendation for this paper</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidence">
                  Confidence Level <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.confidence.toString()}
                  onValueChange={(value) => updateFormField("confidence", parseInt(value))}
                  disabled={isSubmitted}
                >
                  <SelectTrigger id="confidence">
                    <SelectValue placeholder="Select confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low confidence</SelectItem>
                    <SelectItem value="2">2 - Below average</SelectItem>
                    <SelectItem value="3">3 - Average</SelectItem>
                    <SelectItem value="4">4 - High confidence</SelectItem>
                    <SelectItem value="5">5 - Very high confidence</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How confident are you in this assessment?</p>
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="summary">
                  Meta-review Summary <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => updateFormField("summary", e.target.value)}
                  placeholder="Provide a comprehensive summary of your meta-review, synthesizing all individual reviews"
                  disabled={isSubmitted}
                  rows={6}
                  maxLength={3000}
                />
                <p className="text-xs text-muted-foreground">
                  Synthesize all reviews and provide your expert assessment (max 3000 chars)
                </p>
              </div>
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
                <div className="space-y-2">
                  <Label htmlFor="strengths">
                    Key Strengths <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="strengths"
                    value={formData.strengths}
                    onChange={(e) => updateFormField("strengths", e.target.value)}
                    placeholder="List and elaborate on the paper's main strengths"
                    disabled={isSubmitted}
                    rows={8}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">Consolidated view of strengths (max 2000 chars)</p>
                </div>
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
                <div className="space-y-2">
                  <Label htmlFor="weaknesses">
                    Key Weaknesses <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="weaknesses"
                    value={formData.weaknesses}
                    onChange={(e) => updateFormField("weaknesses", e.target.value)}
                    placeholder="List and elaborate on the paper's main weaknesses"
                    disabled={isSubmitted}
                    rows={8}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Consolidated view of weaknesses (max 2000 chars)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review Consensus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" />
                Review Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="consensus">Reviewer Consensus</Label>
                  <p className="text-sm text-muted-foreground">
                    Do all reviewers generally agree on their assessment?
                  </p>
                </div>
                <Switch
                  id="consensus"
                  checked={formData.reviewConsensus}
                  onCheckedChange={(checked: boolean) => updateFormField("reviewConsensus", checked)}
                  disabled={isSubmitted}
                />
              </div>

              {!formData.reviewConsensus && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="disagreementNote">Disagreement Analysis</Label>
                  <Textarea
                    id="disagreementNote"
                    value={formData.disagreementNote}
                    onChange={(e) => updateFormField("disagreementNote", e.target.value)}
                    placeholder="Explain the nature of disagreements between reviewers and how you reconciled them"
                    disabled={isSubmitted}
                    rows={4}
                    maxLength={1500}
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe conflicts and your reasoning (max 1500 chars)
                  </p>
                </div>
              )}
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
                    Submit Meta-review
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
