
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PaperStatusBadge } from "./paper-status-badge";
import { Paper, Conference, PaperKeyword, CameraReadyFile, Review, Decision, PaperAuthor, User } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Tag,
  Users,
  CheckCircle,
  Circle,
  FileText,
  Building2,
  Hash,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

interface OverviewSectionProps {
  paper: Paper & {
    conference?: Conference;
    keywords?: (PaperKeyword & { keyword?: { name: string } })[];
    reviews?: Review[];
    decision?: Decision;
    authors?: (PaperAuthor & { user?: Partial<User> })[];
  };
  cameraReadyFiles: CameraReadyFile[];
}

interface TimelineStep {
  label: string;
  description: string;
  date: string | null | undefined;
  completed: boolean;
  current: boolean;
}

export function OverviewSection({ paper, cameraReadyFiles }: OverviewSectionProps) {
  // Calculate timeline steps with current status
  const getTimelineSteps = (): TimelineStep[] => {
    const hasReviews = !!(paper.reviews && paper.reviews.length > 0);
    const hasDecision = !!paper.decision;
    const hasCameraReady = cameraReadyFiles.some((f) => f.status === "approved");
    const hasPendingCameraReady = cameraReadyFiles.some((f) => f.status === "submitted");

    const steps: TimelineStep[] = [
      {
        label: "Submitted",
        description: "Paper submitted for review",
        date: paper.createdAt,
        completed: true,
        current: paper.status === "submitted" && !hasReviews,
      },
      {
        label: "Under Review",
        description: "Reviewers are evaluating",
        date: hasReviews ? paper.reviews![0]?.submittedAt : null,
        completed: paper.status !== "submitted" || hasReviews,
        current: paper.status === "under_review",
      },
      {
        label: "Decision Made",
        description: hasDecision
          ? `${paper.decision?.decision === "accepted" ? "Accepted" : paper.decision?.decision === "rejected" ? "Rejected" : "Revision required"}`
          : "Awaiting decision",
        date: paper.decision?.decidedAt,
        completed: hasDecision,
        current: hasDecision && !hasCameraReady && paper.status === "accepted",
      },
      {
        label: "Camera Ready",
        description: hasCameraReady
          ? "Final version approved"
          : hasPendingCameraReady
          ? "Pending approval"
          : "Upload final version",
        date: cameraReadyFiles.find((f) => f.status === "approved")?.decidedAt,
        completed: hasCameraReady,
        current: hasPendingCameraReady,
      },
    ];

    return steps;
  };

  const timelineSteps = getTimelineSteps();
  const currentStepIndex = timelineSteps.findIndex((s) => s.current);

  return (
    <div className="space-y-6">
      {/* Paper Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              {/* Paper ID */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-3.5 w-3.5" />
                <span className="font-mono">{paper.id.slice(0, 8)}</span>
              </div>
              {/* Title */}
              <CardTitle className="text-xl leading-tight">{paper.title}</CardTitle>
              {/* Conference */}
              {paper.conference && (
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Building2 className="h-4 w-4" />
                  <span>{paper.conference.name}</span>
                </CardDescription>
              )}
            </div>
            <div className="shrink-0">
              <PaperStatusBadge status={paper.status} />
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Abstract */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Abstract
              </h4>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {paper.abstract || "No abstract provided for this paper."}
                </p>
              </div>
            </div>

            {/* Keywords */}
            {paper.keywords && paper.keywords.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {paper.keywords.map((kw) => (
                    <Badge
                      key={kw.id}
                      variant="secondary"
                      className="px-3 py-1 text-xs font-medium"
                    >
                      {kw.keyword?.name || "Unknown"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Submission Timeline
          </CardTitle>
          <CardDescription>Track the progress of your paper</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Timeline */}
          <div className="hidden sm:block">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${((currentStepIndex >= 0 ? currentStepIndex : timelineSteps.filter((s) => s.completed).length - 1) / (timelineSteps.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Steps */}
              <div className="relative flex justify-between">
                {timelineSteps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center" style={{ width: "25%" }}>
                    {/* Circle */}
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        step.completed
                          ? "border-primary bg-primary text-primary-foreground"
                          : step.current
                          ? "border-primary bg-background text-primary animate-pulse"
                          : "border-muted bg-background text-muted-foreground"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="mt-3 text-center px-1">
                      <p
                        className={`text-sm font-medium ${
                          step.completed || step.current ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      {step.date && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {formatDate(step.date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Timeline (Vertical) */}
          <div className="sm:hidden space-y-4">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex gap-4">
                {/* Circle and Line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      step.completed
                        ? "border-primary bg-primary text-primary-foreground"
                        : step.current
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-background text-muted-foreground"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  {index < timelineSteps.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 mt-2 ${
                        step.completed ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="pb-4">
                  <p
                    className={`text-sm font-medium ${
                      step.completed || step.current ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  {step.date && (
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(step.date)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metadata Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Submitted Date */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm font-medium truncate">{formatDateTime(paper.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium truncate">{formatDateTime(paper.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authors Count */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Authors</p>
                <p className="text-sm font-medium">{paper.authors?.length || 0} author(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Count */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Reviews</p>
                <p className="text-sm font-medium">{paper.reviews?.length || 0} review(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conference Details (if available) */}
      {paper.conference && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Conference Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Conference Name</p>
                <p className="text-sm font-medium">{paper.conference.name}</p>
              </div>
              {paper.conference.location && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="text-sm font-medium">{paper.conference.location}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                <p className="text-sm font-medium">{formatDate(paper.conference.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">End Date</p>
                <p className="text-sm font-medium">{formatDate(paper.conference.endDate)}</p>
              </div>
              {paper.conference.settings?.submissionDeadline && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Submission Deadline</p>
                  <p className="text-sm font-medium">
                    {formatDateTime(paper.conference.settings.submissionDeadline)}
                  </p>
                </div>
              )}
              {paper.conference.settings?.reviewDeadline && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Review Deadline</p>
                  <p className="text-sm font-medium">
                    {formatDateTime(paper.conference.settings.reviewDeadline)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
