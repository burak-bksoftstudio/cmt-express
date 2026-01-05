
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { KeywordInput } from "./keyword-input";
import { paperApi, conferenceApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Conference } from "@/types";
import {
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Building2,
  Type,
  AlignLeft,
  Tag,
  File,
  ArrowRight,
  Sparkles,
  Clock,
  AlertTriangle,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

// File validation constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_FILE_TYPES = ["application/pdf"];

interface FormData {
  conferenceId: string;
  title: string;
  abstract: string;
  keywords: string[];
}

interface FormErrors {
  conferenceId?: string;
  title?: string;
  abstract?: string;
  keywords?: string;
  file?: string;
}

interface PaperSubmitFormProps {
  defaultConferenceId?: string;
}

export function PaperSubmitForm({ defaultConferenceId }: PaperSubmitFormProps = {}) {
  const navigate = useNavigate();
  const { permissions } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    conferenceId: defaultConferenceId || "",
    title: "",
    abstract: "",
    keywords: [],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Loading states
  const [loadingConferences, setLoadingConferences] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<"idle" | "creating" | "uploading" | "success">("idle");

  // Data
  const [conferences, setConferences] = useState<Conference[]>([]);

  // Load conferences on mount
  useEffect(() => {
    const loadConferences = async () => {
      setLoadingConferences(true);
      try {
        const response = permissions.isAdmin
          ? await conferenceApi.getAll()
          : await conferenceApi.getMyConferences();
        // API returns { success: true, data: [...] }, extract the array
        const conferenceData = response.data?.data || response.data || [];
        setConferences(Array.isArray(conferenceData) ? conferenceData : []);
      } catch (error: unknown) {
        console.error("Failed to load conferences:", error);
        setApiError("Failed to load conferences. Please refresh the page.");
      } finally {
        setLoadingConferences(false);
      }
    };

    loadConferences();
  }, [permissions.isAdmin]);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setApiError(null);
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: "Only PDF files are allowed" }));
      setSelectedFile(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, file: "File size must be less than 20 MB" }));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setErrors((prev) => ({ ...prev, file: undefined }));
  }, []);

  // Remove selected file
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.conferenceId) {
      newErrors.conferenceId = "Please select a conference";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 10) {
      newErrors.title = "Title must be at least 10 characters";
    } else if (formData.title.trim().length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!formData.abstract.trim()) {
      newErrors.abstract = "Abstract is required";
    } else if (formData.abstract.trim().length < 50) {
      newErrors.abstract = "Abstract must be at least 50 characters";
    } else if (formData.abstract.trim().length > 5000) {
      newErrors.abstract = "Abstract must be less than 5000 characters";
    }

    if (formData.keywords.length === 0) {
      newErrors.keywords = "At least one keyword is required";
    }

    if (!selectedFile) {
      newErrors.file = "Please upload your paper (PDF)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!selectedFile) return;

    setSubmitting(true);
    setApiError(null);

    try {
      // Step 1: Create paper
      setSubmitStep("creating");
      const createResponse = await paperApi.create({
        conferenceId: formData.conferenceId,
        title: formData.title.trim(),
        abstract: formData.abstract.trim(),
        keywords: formData.keywords,
      });

      const paperId = createResponse.data.id;

      // Step 2: Upload file
      setSubmitStep("uploading");
      await paperApi.uploadFile(paperId, selectedFile);

      // Step 3: Success
      setSubmitStep("success");

      // Redirect after short delay
      setTimeout(() => {
        navigate(`/papers/${paperId}`);
      }, 1500);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Failed to submit paper. Please try again.";
      setApiError(message);
      setSubmitStep("idle");
    } finally {
      setSubmitting(false);
    }
  };

  // Get selected conference
  const selectedConference = conferences.find((c) => c.id === formData.conferenceId);

  // Check if submission deadline has passed
  const isDeadlinePassed = selectedConference?.settings?.submissionDeadline
    ? new Date() > new Date(selectedConference.settings.submissionDeadline)
    : false;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* API Error Alert */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: appleEasing }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success State */}
      <AnimatePresence>
        {submitStep === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: appleEasing }}
          >
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">
                Paper Submitted Successfully!
              </AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-500">
                Redirecting to your paper details...
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 1: Conference Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Select Conference
            </CardTitle>
            <CardDescription>
              Choose the conference you want to submit your paper to
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {loadingConferences ? (
              <Skeleton className="h-10 w-full" />
            ) : conferences.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No conferences available. Please join a conference first.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="conference">Conference *</Label>
                <Select
                  value={formData.conferenceId}
                  onValueChange={(value) => handleFieldChange("conferenceId", value)}
                  disabled={submitting}
                >
                  <SelectTrigger
                    id="conference"
                    className={errors.conferenceId ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select a conference" />
                  </SelectTrigger>
                  <SelectContent>
                    {conferences.map((conf) => (
                      <SelectItem key={conf.id} value={conf.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{conf.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.conferenceId && (
                  <p className="text-xs text-destructive">{errors.conferenceId}</p>
                )}
                {selectedConference && (
                  <p className="text-xs text-muted-foreground">
                    {selectedConference.location && `📍 ${selectedConference.location} • `}
                    {new Date(selectedConference.startDate).toLocaleDateString()} -{" "}
                    {new Date(selectedConference.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Submission Deadline Warning */}
            {selectedConference?.settings?.submissionDeadline && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: appleEasing }}
                  className="mt-4"
                >
                  {(() => {
                    const deadline = new Date(selectedConference.settings.submissionDeadline);
                    const now = new Date();
                    const isOverdue = now > deadline;
                    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isWarning = daysUntilDeadline <= 7 && daysUntilDeadline > 0;

                    return (
                      <Alert
                        variant={isOverdue ? "destructive" : isWarning ? "default" : "default"}
                        className={
                          isOverdue
                            ? "border-destructive bg-destructive/10"
                            : isWarning
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10"
                            : "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                        }
                      >
                        {isOverdue ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                        <AlertTitle className={isOverdue ? "" : isWarning ? "text-yellow-700 dark:text-yellow-400" : "text-blue-700 dark:text-blue-400"}>
                          {isOverdue
                            ? "Submission Deadline Passed"
                            : isWarning
                            ? `Deadline Approaching - ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"} left`
                            : "Submission Deadline"}
                        </AlertTitle>
                        <AlertDescription className={isOverdue ? "" : isWarning ? "text-yellow-600 dark:text-yellow-500" : "text-blue-600 dark:text-blue-500"}>
                          {isOverdue
                            ? `The submission deadline was ${deadline.toLocaleString()}. You cannot submit papers to this conference.`
                            : `Submission deadline: ${deadline.toLocaleString()}`}
                        </AlertDescription>
                      </Alert>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 2: Paper Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Type className="h-5 w-5 text-primary" />
              Paper Details
            </CardTitle>
            <CardDescription>
              Enter your paper&apos;s title and abstract
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="Enter your paper title"
                disabled={submitting}
                className={errors.title ? "border-destructive" : ""}
                maxLength={200}
              />
              <div className="flex items-center justify-between">
                {errors.title ? (
                  <p className="text-xs text-destructive">{errors.title}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    A clear, concise title for your paper
                  </p>
                )}
                <span className="text-xs text-muted-foreground">
                  {formData.title.length} / 200
                </span>
              </div>
            </div>

            {/* Abstract */}
            <div className="space-y-2">
              <Label htmlFor="abstract" className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4" />
                Abstract *
              </Label>
              <Textarea
                id="abstract"
                value={formData.abstract}
                onChange={(e) => handleFieldChange("abstract", e.target.value)}
                placeholder="Enter your paper abstract (minimum 50 characters)..."
                disabled={submitting}
                className={`min-h-[200px] resize-y ${errors.abstract ? "border-destructive" : ""}`}
                maxLength={5000}
              />
              <div className="flex items-center justify-between">
                {errors.abstract ? (
                  <p className="text-xs text-destructive">{errors.abstract}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Summarize your paper&apos;s key contributions
                  </p>
                )}
                <span className="text-xs text-muted-foreground">
                  {formData.abstract.length} / 5000
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 3: Keywords */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-primary" />
              Keywords
            </CardTitle>
            <CardDescription>
              Add keywords to help others find your paper (up to 8)
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label>Keywords *</Label>
              <KeywordInput
                keywords={formData.keywords}
                onChange={(keywords) => handleFieldChange("keywords", keywords)}
                disabled={submitting}
                maxKeywords={8}
                maxLength={20}
              />
              {errors.keywords && (
                <p className="text-xs text-destructive">{errors.keywords}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 4: File Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Upload Paper
            </CardTitle>
            <CardDescription>
              Upload your paper as a PDF file (max 20 MB)
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={submitting}
            />

            {!selectedFile ? (
              // Upload Zone
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className={`w-full rounded-lg border-2 border-dashed p-8 text-center transition-all hover:border-primary hover:bg-primary/5 ${
                  errors.file ? "border-destructive" : "border-muted-foreground/25"
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Click to upload your paper</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      PDF only, max 20 MB
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              // File Preview
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: appleEasing }}
                className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <File className="h-7 w-7 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • PDF Document
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    disabled={submitting}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {errors.file && (
              <p className="mt-2 text-xs text-destructive">{errors.file}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: appleEasing, delay: 0.4 }}
      >
        <Card className="bg-linear-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="font-medium flex items-center gap-2">
                  {isDeadlinePassed ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Submission Closed
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-primary" />
                      Ready to submit?
                    </>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isDeadlinePassed
                    ? "The submission deadline has passed for this conference"
                    : "Review your paper details before submitting"}
                </p>
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={submitting || loadingConferences || submitStep === "success" || isDeadlinePassed}
                className="w-full sm:w-auto min-w-[200px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {submitStep === "creating" && "Creating Paper..."}
                    {submitStep === "uploading" && "Uploading File..."}
                  </>
                ) : submitStep === "success" ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submitted!
                  </>
                ) : (
                  <>
                    Submit Paper
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </form>
  );
}

