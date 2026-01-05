import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  PaperStatusBadge,
  SectionNavigation,
  PaperSection,
  OverviewSection,
  AuthorsSection,
  FilesSection,
  ReviewsSection,
  BiddingSection,
  CameraReadySection,
  DecisionSection,
  EditPaperDialog,
} from "@/components/papers";
import { PaperVersionHistory } from "@/components/paper/PaperVersionHistory";
import { AssignmentPanel } from "@/components/assignment";
import { DiscussionPanel } from "@/components/discussion/DiscussionPanel";
import { appleEasing } from "@/components/motion";
import { useAuth } from "@/hooks/use-auth";
import { paperApi, biddingApi, cameraReadyApi, metareviewApi, MetareviewData } from "@/lib/api";
import {
  Paper,
  PaperAuthor,
  PaperFile,
  PaperKeyword,
  Review,
  ReviewerAssignment,
  Decision,
  Conference,
  PaperBid,
  CameraReadyFile,
  User,
} from "@/types";
import { ArrowLeft, Calendar, AlertCircle, RefreshCw, Pencil, MessageSquare, Star, Edit2, CheckCircle, Clock } from "lucide-react";

interface PaperWithDetails extends Paper {
  conference?: Conference;
  authors?: (PaperAuthor & { user?: Partial<User> })[];
  keywords?: (PaperKeyword & { keyword?: { name: string } })[];
  files?: PaperFile[];
  reviews?: (Review & { assignment?: ReviewerAssignment & { reviewer?: Partial<User> } })[];
  assignments?: (ReviewerAssignment & { reviewer?: Partial<User> })[];
  decision?: Decision;
}

export default function PaperDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const paperId = params.paperId as string;
  const { user, permissions, isChairOfConference } = useAuth();

  const [paper, setPaper] = useState<PaperWithDetails | null>(null);
  const [cameraReadyFiles, setCameraReadyFiles] = useState<CameraReadyFile[]>([]);
  const [paperBids, setPaperBids] = useState<(PaperBid & { user?: Partial<User> })[]>([]);
  const [userBid, setUserBid] = useState<PaperBid | null>(null);
  const [metareview, setMetareview] = useState<MetareviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<PaperSection>("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isAdmin = permissions.isAdmin;
  const isChair = paper?.conferenceId ? isChairOfConference(paper.conferenceId) : false;
  const isReviewer = permissions.isReviewer;
  const isAuthor = paper?.authors?.some((a) => a.userId === user?.id) ?? false;
  const hasManageAccess = isAdmin || isChair;

  // Check if user is a meta-reviewer (has META_REVIEWER role) - simplified for now
  const isMetaReviewer = isChair; // For now, chairs can act as meta-reviewers
  const canAccessMetareview = isMetaReviewer || hasManageAccess;
  const canAccessDiscussion = isMetaReviewer || hasManageAccess;

  // Check if submission deadline has passed
  const isDeadlinePassed = paper?.conference?.settings?.submissionDeadline
    ? new Date() > new Date(paper.conference.settings.submissionDeadline)
    : false;

  // Can edit: Author + status is "submitted" + no review assignments + before deadline (or admin)
  const canEdit =
    isAuthor &&
    paper?.status === "submitted" &&
    (!paper?.assignments || paper.assignments.length === 0) &&
    (!isDeadlinePassed || isAdmin) &&
    !paper?.decision; // Cannot edit after decision is made

  // Double-blind review: Authors can only see reviews after decision is made
  const hasDecision = paper?.status === "accepted" || paper?.status === "rejected";
  const canSeeReviews = hasManageAccess || (isAuthor && hasDecision);
  const canSeeFullReviewDetails = hasManageAccess; // Only chair/admin see scores, confidence, etc.

  const fetchPaper = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await paperApi.getById(paperId);
      setPaper(response.data.data);

      try {
        const crResponse = await cameraReadyApi.getByPaper(paperId);
        setCameraReadyFiles(crResponse.data.data || []);
      } catch {
        setCameraReadyFiles([]);
      }

      try {
        const bidsResponse = await biddingApi.getPaperBids(paperId);
        const bids = bidsResponse.data.data || [];
        setPaperBids(bids);
        const myBid = bids.find((b: PaperBid) => b.userId === user?.id);
        setUserBid(myBid || null);
      } catch {
        setPaperBids([]);
        setUserBid(null);
      }

      // Fetch metareview if available
      try {
        const metareviewResponse = await metareviewApi.getByPaper(paperId);
        setMetareview(metareviewResponse.data.data || null);
      } catch {
        setMetareview(null);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load paper";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [paperId, user?.id]);

  useEffect(() => {
    fetchPaper();
  }, [fetchPaper]);

  const renderSectionContent = () => {
    if (!paper) return null;

    switch (activeSection) {
      case "overview":
        return <OverviewSection paper={paper} cameraReadyFiles={cameraReadyFiles} />;
      case "authors":
        return <AuthorsSection authors={paper.authors || []} />;
      case "files":
        return (
          <div className="space-y-6">
            <FilesSection
              files={paper.files || []}
              paperId={paperId}
              canUpload={isAuthor}
              canDelete={isAuthor || hasManageAccess}
              onFileChanged={fetchPaper}
            />
            <PaperVersionHistory paperId={paperId} />
          </div>
        );
      case "reviews":
        // Double-blind: Authors can only see reviews after decision, and only commentsToAuthor
        if (!canSeeReviews) {
          return (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Reviews Not Available</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    Reviews will be visible after the decision has been made on your paper.
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        }
        return (
          <ReviewsSection
            reviews={paper.reviews || []}
            showReviewer={hasManageAccess}
            showFullDetails={canSeeFullReviewDetails}
          />
        );
      case "assignments":
        return (
          <AssignmentPanel
            paperId={paperId}
            conferenceId={paper.conferenceId}
            canManage={hasManageAccess}
            onUpdate={fetchPaper}
          />
        );
      case "bidding":
        return (
          <BiddingSection
            paperId={paperId}
            userBid={userBid}
            allBids={paperBids}
            isReviewer={isReviewer}
            isAuthor={isAuthor}
            canManage={hasManageAccess}
            onBidChange={fetchPaper}
          />
        );
      case "camera-ready":
        return (
          <CameraReadySection
            paperId={paperId}
            paperStatus={paper.status}
            files={cameraReadyFiles}
            canUpload={isAuthor && paper.status === "accepted"}
            canApprove={hasManageAccess}
            onUpdate={fetchPaper}
          />
        );
      case "metareview":
        return (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Meta-review
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Consolidated expert assessment synthesizing all reviews
                  </p>
                </div>
                {metareview ? (
                  metareview.submittedAt ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      Draft
                    </Badge>
                  )
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {metareview ? (
                <div className="space-y-6">
                  {/* Recommendation & Confidence */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Recommendation</p>
                      <Badge className={
                        metareview.recommendation === "ACCEPT"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : metareview.recommendation === "REJECT"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }>
                        {metareview.recommendation}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Confidence</p>
                      <p className="text-lg font-semibold">{metareview.confidence}/5</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{metareview.summary}</p>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Strengths
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{metareview.strengths}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Weaknesses
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{metareview.weaknesses}</p>
                    </div>
                  </div>

                  {/* Consensus */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Reviewer Consensus</h3>
                    <Badge variant={metareview.reviewConsensus ? "default" : "outline"}>
                      {metareview.reviewConsensus ? "Yes" : "No"}
                    </Badge>
                    {!metareview.reviewConsensus && metareview.disagreementNote && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                        {metareview.disagreementNote}
                      </p>
                    )}
                  </div>

                  {/* Meta-reviewer info */}
                  {metareview.metaReviewer && (
                    <div className="text-sm text-muted-foreground">
                      By {metareview.metaReviewer.firstName} {metareview.metaReviewer.lastName}
                      {metareview.submittedAt && (
                        <span> • {new Date(metareview.submittedAt).toLocaleString()}</span>
                      )}
                    </div>
                  )}

                  {/* Edit button */}
                  {canAccessMetareview && (
                    <Button onClick={() => navigate(`/papers/${paperId}/metareview`)} className="gap-2">
                      <Edit2 className="h-4 w-4" />
                      {metareview.submittedAt ? "View" : "Edit"} Meta-review
                    </Button>
                  )}
                </div>
              ) : canAccessMetareview ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No meta-review has been created yet</p>
                  <Button onClick={() => navigate(`/papers/${paperId}/metareview`)} className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Create Meta-review
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Meta-review not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      case "discussion":
        return canAccessDiscussion && paper.conferenceId ? (
          <DiscussionPanel
            paperId={paperId}
            conferenceId={paper.conferenceId}
            isChair={isChair}
          />
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Discussion not available</p>
            </CardContent>
          </Card>
        );
      case "decision":
        return <DecisionSection paperId={paperId} conferenceId={paper.conferenceId} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-3/4 max-w-xl" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <Skeleton className="h-[400px] rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-[200px] rounded-lg" />
              <Skeleton className="h-[150px] rounded-lg" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !paper) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link
            to="/papers"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Papers
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Paper not found"}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link to="/papers">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight line-clamp-2">{paper.title}</h1>
                {paper.conference && (
                  <p className="mt-1.5 text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="truncate">{paper.conference.name}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PaperStatusBadge status={paper.status} />
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={fetchPaper}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Left Sidebar - Section Navigation */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="p-3">
                <SectionNavigation
                  activeSection={activeSection}
                  onSectionChange={setActiveSection}
                  showAssignments={hasManageAccess}
                  showBidding={isReviewer || hasManageAccess}
                  showDecision={true}
                  showMetareview={canAccessMetareview}
                  showDiscussion={canAccessDiscussion}
                  reviewCount={paper.reviews?.length}
                  assignmentCount={paper.assignments?.length}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: appleEasing }}
                style={{ willChange: "opacity, transform" }}
              >
                {renderSectionContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Edit Paper Dialog */}
        {paper && (
          <EditPaperDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            paperId={paperId}
            initialData={{
              title: paper.title,
              abstract: paper.abstract || undefined,
              keywords: paper.keywords,
              trackId: paper.trackId || undefined,
            }}
            onSuccess={fetchPaper}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
