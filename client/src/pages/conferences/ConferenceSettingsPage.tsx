import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  GeneralInfoCard,
  DeadlinesCard,
  ReviewSettingsCard,
  SaveBar,
  ConfirmSaveDialog,
} from "@/components/conferences/settings";
import { useAuth } from "@/hooks/use-auth";
import { conferenceApi } from "@/lib/api";
import { Conference } from "@/types";
import {
  ArrowLeft,
  Settings,
  AlertCircle,
  CheckCircle2,
  Shield,
  Eye,
} from "lucide-react";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

// Form state interface
interface FormState {
  // General info
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  // Settings
  submissionDeadline: string;
  reviewDeadline: string;
  maxReviewersPerPaper: number;
  assignmentTimeoutDays: number;
}

// Initial form state
const getInitialFormState = (conference: Conference | null): FormState => ({
  name: conference?.name || "",
  description: conference?.description || "",
  location: conference?.location || "",
  startDate: conference?.startDate || "",
  endDate: conference?.endDate || "",
  submissionDeadline: conference?.settings?.submissionDeadline || "",
  reviewDeadline: conference?.settings?.reviewDeadline || "",
  maxReviewersPerPaper: conference?.settings?.maxReviewersPerPaper || 3,
  assignmentTimeoutDays: conference?.settings?.assignmentTimeoutDays || 7,
});

export default function ConferenceSettingsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const conferenceId = params.id as string;
  const { permissions, isChairOfConference } = useAuth();

  // State
  const [conference, setConference] = useState<Conference | null>(null);
  const [formState, setFormState] = useState<FormState>(getInitialFormState(null));
  const [originalState, setOriginalState] = useState<FormState>(getInitialFormState(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Permission check
  const isAdmin = permissions.isAdmin;
  const isChair = isChairOfConference(conferenceId);
  const canEdit = isAdmin || isChair;

  // Fetch conference data
  const fetchConference = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await conferenceApi.getById(conferenceId);
      const data = response.data.data as Conference;
      setConference(data);
      const initialState = getInitialFormState(data);
      setFormState(initialState);
      setOriginalState(initialState);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load conference";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  // Load data on mount
  useEffect(() => {
    fetchConference();
  }, [fetchConference]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return (
      formState.name !== originalState.name ||
      formState.description !== originalState.description ||
      formState.location !== originalState.location ||
      formState.startDate !== originalState.startDate ||
      formState.endDate !== originalState.endDate ||
      formState.submissionDeadline !== originalState.submissionDeadline ||
      formState.reviewDeadline !== originalState.reviewDeadline ||
      formState.maxReviewersPerPaper !== originalState.maxReviewersPerPaper ||
      formState.assignmentTimeoutDays !== originalState.assignmentTimeoutDays
    );
  }, [formState, originalState]);

  // Get list of changes
  const getChanges = (): string[] => {
    const changes: string[] = [];
    if (formState.name !== originalState.name) changes.push("Name");
    if (formState.description !== originalState.description) changes.push("Description");
    if (formState.location !== originalState.location) changes.push("Location");
    if (formState.startDate !== originalState.startDate) changes.push("Start Date");
    if (formState.endDate !== originalState.endDate) changes.push("End Date");
    if (formState.submissionDeadline !== originalState.submissionDeadline) changes.push("Submission Deadline");
    if (formState.reviewDeadline !== originalState.reviewDeadline) changes.push("Review Deadline");
    if (formState.maxReviewersPerPaper !== originalState.maxReviewersPerPaper) changes.push("Max Reviewers");
    if (formState.assignmentTimeoutDays !== originalState.assignmentTimeoutDays) changes.push("Assignment Timeout");
    return changes;
  };

  // Reset form
  const handleReset = () => {
    setFormState(originalState);
    setSuccessMessage(null);
  };

  // Open confirm dialog
  const handleSaveClick = () => {
    setConfirmDialogOpen(true);
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Check if general info changed
      const generalInfoChanged =
        formState.name !== originalState.name ||
        formState.description !== originalState.description ||
        formState.location !== originalState.location ||
        formState.startDate !== originalState.startDate ||
        formState.endDate !== originalState.endDate;

      // Check if settings changed
      const settingsChanged =
        formState.submissionDeadline !== originalState.submissionDeadline ||
        formState.reviewDeadline !== originalState.reviewDeadline ||
        formState.maxReviewersPerPaper !== originalState.maxReviewersPerPaper ||
        formState.assignmentTimeoutDays !== originalState.assignmentTimeoutDays;

      // Update general info if changed
      if (generalInfoChanged) {
        await conferenceApi.update(conferenceId, {
          name: formState.name,
          description: formState.description || undefined,
          location: formState.location || undefined,
          startDate: formState.startDate,
          endDate: formState.endDate,
        });
      }

      // Update settings if changed
      if (settingsChanged) {
        await conferenceApi.updateSettings(conferenceId, {
          submissionDeadline: formState.submissionDeadline || undefined,
          reviewDeadline: formState.reviewDeadline || undefined,
          maxReviewersPerPaper: formState.maxReviewersPerPaper,
          assignmentTimeoutDays: formState.assignmentTimeoutDays,
        });
      }

      // Update original state
      setOriginalState(formState);
      setSuccessMessage("Settings saved successfully");
      setConfirmDialogOpen(false);

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to save settings";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error && !conference) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            to="/conferences"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Conferences
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: appleEasing }}
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <Link to={`/conferences/${conferenceId}`}>
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Conference Settings
              </h1>
              <p className="text-muted-foreground mt-1">
                {conference?.name || "Conference"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit ? (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Shield className="mr-1 h-3 w-3" />
                {isAdmin ? "Admin" : "Chair"}
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Eye className="mr-1 h-3 w-3" />
                View Only
              </Badge>
            )}
          </div>
        </motion.div>

        {/* View-only notice */}
        {!canEdit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: appleEasing }}
          >
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-200">View Only</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                You don't have permission to edit these settings.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Error alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Success alert */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
              <AlertDescription className="flex items-center justify-between text-green-700 dark:text-green-300">
                <span>{successMessage}</span>
                <Button variant="ghost" size="sm" onClick={() => setSuccessMessage(null)}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Form sections */}
        <div className="space-y-6">
          {/* General Information */}
          <GeneralInfoCard
            name={formState.name}
            description={formState.description}
            location={formState.location}
            startDate={formState.startDate}
            endDate={formState.endDate}
            disabled={!canEdit}
            onNameChange={(value) => setFormState((s) => ({ ...s, name: value }))}
            onDescriptionChange={(value) => setFormState((s) => ({ ...s, description: value }))}
            onLocationChange={(value) => setFormState((s) => ({ ...s, location: value }))}
            onStartDateChange={(value) => setFormState((s) => ({ ...s, startDate: value }))}
            onEndDateChange={(value) => setFormState((s) => ({ ...s, endDate: value }))}
          />

          {/* Deadlines */}
          <DeadlinesCard
            submissionDeadline={formState.submissionDeadline}
            reviewDeadline={formState.reviewDeadline}
            disabled={!canEdit}
            onSubmissionDeadlineChange={(value) =>
              setFormState((s) => ({ ...s, submissionDeadline: value }))
            }
            onReviewDeadlineChange={(value) =>
              setFormState((s) => ({ ...s, reviewDeadline: value }))
            }
          />

          {/* Review Settings */}
          <ReviewSettingsCard
            maxReviewersPerPaper={formState.maxReviewersPerPaper}
            assignmentTimeoutDays={formState.assignmentTimeoutDays}
            disabled={!canEdit}
            onMaxReviewersChange={(value) =>
              setFormState((s) => ({ ...s, maxReviewersPerPaper: value }))
            }
            onAssignmentTimeoutChange={(value) =>
              setFormState((s) => ({ ...s, assignmentTimeoutDays: value }))
            }
          />
        </div>

        {/* Sticky Save Bar */}
        {canEdit && (
          <SaveBar
            isDirty={isDirty}
            isSaving={saving}
            onSave={handleSaveClick}
            onReset={handleReset}
            label="You have unsaved changes"
            help="Save your changes before leaving"
            resetLabel="Reset"
            saveLabel="Save Changes"
            savingLabel="Saving..."
          />
        )}

        {/* Confirm Save Dialog */}
        <ConfirmSaveDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={handleSave}
          isSaving={saving}
          changes={getChanges()}
          title="Save Changes"
          description="You are about to save the following changes:"
          warning="This action cannot be undone."
          cancelLabel="Cancel"
          saveLabel="Save Changes"
          savingLabel="Saving..."
        />
      </div>
    </DashboardLayout>
  );
}
