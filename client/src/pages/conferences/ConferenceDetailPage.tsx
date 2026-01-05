import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConferenceSettingsModal } from "@/components/conferences/conference-settings-modal";
import { TrackManagementDialog } from "@/components/conferences/track-management-dialog";
import { MembersSection } from "@/components/conference-members";
import { useAuth } from "@/hooks/use-auth";
import { conferenceApi, api } from "@/lib/api";
import { Conference, ConferenceRole } from "@/types";
import { formatDate, formatDateTime, getDeadlineStatus } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Settings,
  Users,
  FileText,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2,
  Timer,
  Edit,
  Archive,
  ArchiveRestore,
  FolderTree,
} from "lucide-react";

interface ConferenceWithDetails extends Conference {
  _count?: {
    papers: number;
    userConferenceRoles: number;
  };
  userConferenceRoles?: (ConferenceRole & { user?: { id: string; firstName: string; lastName: string; email: string } })[];
}

export default function ConferenceDetailPage() {
  const params = useParams();
  const conferenceId = params.id as string;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, permissions, hasRoleForConference, isChairOfConference } = useAuth();

  const [conference, setConference] = useState<ConferenceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const isAdmin = permissions.isAdmin;
  const isChair = isChairOfConference(conferenceId);
  const hasManageAccess = isAdmin || isChair;
  const isArchived = conference?.status === "archived";

  const fetchConference = useCallback(async () => {
    try {
      setLoading(true);
      const response = await conferenceApi.getById(conferenceId);
      setConference(response.data.data);
      setError("");
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load conference";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    fetchConference();
  }, [fetchConference]);

  const getConferenceStatus = () => {
    if (!conference) return { label: "Unknown", variant: "outline" as const };
    const now = new Date();
    const start = new Date(conference.startDate);
    const end = new Date(conference.endDate);

    if (now < start) return { label: "Upcoming", variant: "secondary" as const };
    if (now >= start && now <= end) return { label: "Active", variant: "default" as const };
    return { label: "Completed", variant: "outline" as const };
  };

  const getUserRole = (): string | null => {
    if (isAdmin) return "Admin";
    if (!conference?.userConferenceRoles || !user) return null;
    const userRole = conference.userConferenceRoles.find(r => r.userId === user.id);
    if (!userRole) return null;
    return userRole.role.charAt(0).toUpperCase() + userRole.role.slice(1);
  };

  const handleArchive = async () => {
    if (!conference) return;

    setArchiving(true);
    try {
      await api.post(`/conferences/${conferenceId}/archive`);

      toast({
        title: "Conference Archived",
        description: "The conference has been archived successfully",
      });

      setArchiveDialogOpen(false);
      fetchConference();
    } catch (error: any) {
      console.error("Failed to archive conference:", error);
      toast({
        variant: "destructive",
        title: "Archive Failed",
        description: error.response?.data?.message || "Failed to archive conference",
      });
    } finally {
      setArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    if (!conference) return;

    setArchiving(true);
    try {
      await api.post(`/conferences/${conferenceId}/unarchive`);

      toast({
        title: "Conference Unarchived",
        description: "The conference has been unarchived successfully",
      });

      setUnarchiveDialogOpen(false);
      fetchConference();
    } catch (error: any) {
      console.error("Failed to unarchive conference:", error);
      toast({
        variant: "destructive",
        title: "Unarchive Failed",
        description: error.response?.data?.message || "Failed to unarchive conference",
      });
    } finally {
      setArchiving(false);
    }
  };

  const renderDeadlineStatus = (deadline: string | null | undefined, label: string) => {
    const status = getDeadlineStatus(deadline);
    const statusColors = {
      safe: "text-green-600 dark:text-green-400",
      warning: "text-yellow-600 dark:text-yellow-400",
      danger: "text-red-600 dark:text-red-400",
      passed: "text-muted-foreground",
    };
    const statusIcons = {
      safe: <CheckCircle2 className="h-4 w-4" />,
      warning: <AlertCircle className="h-4 w-4" />,
      danger: <AlertCircle className="h-4 w-4" />,
      passed: <Clock className="h-4 w-4" />,
    };

    return (
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {deadline ? (
            <>
              <span className="font-medium">{formatDateTime(deadline)}</span>
              <span className={`flex items-center gap-1 ${statusColors[status.status]}`}>
                {statusIcons[status.status]}
                <span className="text-xs">{status.message}</span>
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Not set</span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !conference) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link to="/conferences" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Conferences
          </Link>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Conference not found"}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const status = getConferenceStatus();
  const userRole = getUserRole();
  const papersCount = conference._count?.papers || 0;
  const membersCount = conference._count?.userConferenceRoles || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Link to="/conferences">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{conference.name}</h1>
                <Badge variant={status.variant}>{status.label}</Badge>
                {isArchived && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                    <Archive className="mr-1 h-3 w-3" />
                    Archived
                  </Badge>
                )}
                {userRole && (
                  <Badge variant={userRole === "Admin" ? "destructive" : "secondary"}>
                    {userRole}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">
                {conference.description || "No description provided"}
              </p>
            </div>
          </div>

          {hasManageAccess && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSettingsModalOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Settings
              </Button>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* General Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Start Date</span>
                    <p className="font-medium">{formatDate(conference.startDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">End Date</span>
                    <p className="font-medium">{formatDate(conference.endDate)}</p>
                  </div>
                </div>
                {conference.location && (
                  <div>
                    <span className="text-sm text-muted-foreground">Location</span>
                    <p className="flex items-center gap-2 font-medium">
                      <MapPin className="h-4 w-4" />
                      {conference.location}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Created</span>
                  <p className="font-medium">{formatDateTime(conference.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Deadlines Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Deadlines
                </CardTitle>
                <CardDescription>Important dates and deadlines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderDeadlineStatus(conference.settings?.submissionDeadline, "Submission Deadline")}
                <Separator />
                {renderDeadlineStatus(conference.settings?.reviewDeadline, "Review Deadline")}
              </CardContent>
            </Card>

            {/* Settings Card */}
            {conference.settings && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <span className="text-sm text-muted-foreground">Max Reviewers per Paper</span>
                      <p className="mt-1 text-2xl font-bold">{conference.settings.maxReviewersPerPaper}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <span className="text-sm text-muted-foreground">Assignment Timeout</span>
                      <p className="mt-1 text-2xl font-bold">
                        {conference.settings.assignmentTimeoutDays} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Stats & Quick Actions */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Papers</span>
                  <span className="text-2xl font-bold">{papersCount}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <span className="text-2xl font-bold">{membersCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Members Section */}
            <MembersSection conferenceId={conferenceId} />

            {/* Management Panel (Admin/Chair only) */}
            {hasManageAccess && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Management
                  </CardTitle>
                  <CardDescription>Administrative actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setSettingsModalOpen(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Settings
                  </Button>
                  <Link to={`/conferences/${conferenceId}/members`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Manage Members
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setTrackDialogOpen(true)}
                  >
                    <FolderTree className="mr-2 h-4 w-4" />
                    Manage Tracks
                  </Button>
                  <Separator />
                  {isArchived ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-green-600 hover:text-green-700"
                      onClick={() => setUnarchiveDialogOpen(true)}
                    >
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Unarchive Conference
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-yellow-600 hover:text-yellow-700"
                      onClick={() => setArchiveDialogOpen(true)}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Conference
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={`/papers?conference=${conferenceId}`}>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    View Papers
                  </Button>
                </Link>
                {(isAdmin || isChair || hasRoleForConference(conferenceId, "reviewer")) && (
                  <Link to={`/reviews?conference=${conferenceId}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="mr-2 h-4 w-4" />
                      View Assignments
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <ConferenceSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        conferenceId={conferenceId}
        settings={conference.settings}
        onSuccess={fetchConference}
      />

      {/* Archive Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Conference</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{conference.name}"? Archived conferences will be hidden from the
              active conference list but can be unarchived later. All data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={archiving}>
              {archiving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unarchive Dialog */}
      <AlertDialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unarchive Conference</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unarchive "{conference.name}"? The conference will be restored to the active
              conference list and all functionality will be available again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnarchive} disabled={archiving}>
              {archiving ? "Unarchiving..." : "Unarchive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Track Management Dialog */}
      <TrackManagementDialog
        open={trackDialogOpen}
        onOpenChange={setTrackDialogOpen}
        conferenceId={conferenceId}
        conferenceName={conference.name}
      />
    </DashboardLayout>
  );
}
