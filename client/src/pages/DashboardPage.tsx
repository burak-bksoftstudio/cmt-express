import { useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardStore } from "@/stores/dashboard-store";
import {
  ConferenceSelector,
  StatsCards,
  PapersDonutChart,
  ReviewsBarChart,
  TimelineAreaChart,
  ReviewerLoadTable,
  BiddingSummary,
  AuthorDashboard,
  ReviewerDashboard,
  ChairDashboard,
} from "./components";
import {
  Calendar,
  AlertCircle,
  RefreshCw,
  Building2,
} from "lucide-react";

export default function DashboardPage() {
  const { user, permissions } = useAuth();
  const {
    conferences,
    selectedConferenceId,
    conferencesLoading,
    statsLoading,
    error,
    clearError,
    fetchConferences,
    fetchStats,
  } = useDashboardStore();

  useEffect(() => {
    fetchConferences(permissions.isAdmin);
  }, [permissions.isAdmin, fetchConferences]);

  const selectedConference = conferences.find((c) => c.id === selectedConferenceId);

  const handleRefresh = () => {
    if (selectedConferenceId) {
      fetchStats(selectedConferenceId);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Conference Selector */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.firstName || "User"}
            </h1>
            <p className="text-muted-foreground">
              {selectedConference
                ? `Viewing ${selectedConference.name}`
                : "Select a conference to view stats"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ConferenceSelector />
            {selectedConferenceId && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={statsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`}
                />
              </Button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading state for conferences */}
        {conferencesLoading && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No conferences state */}
        {!conferencesLoading && conferences.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">No Conferences</h3>
              <p className="mt-2 max-w-sm text-center text-muted-foreground">
                {permissions.isAdmin
                  ? "Create your first conference to get started."
                  : "You are not part of any conferences yet."}
              </p>
              {permissions.isAdmin && (
                <Link to="/conferences/create" className="mt-6">
                  <Button>Create Conference</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Content */}
        {!conferencesLoading && conferences.length > 0 && (
          <>
            {/* Role-Based Dashboards */}

            {/* Author Dashboard - Show if user has AUTHOR role and no higher role */}
            {permissions.isAuthor && !permissions.isChair && !permissions.isReviewer && (
              <AuthorDashboard />
            )}

            {/* Reviewer Dashboard - Show if user has REVIEWER role but not CHAIR */}
            {permissions.isReviewer && !permissions.isChair && (
              <ReviewerDashboard />
            )}

            {/* Chair Dashboard - Show for Chairs and Admins */}
            {(permissions.isChair || permissions.isAdmin) && selectedConferenceId && (
              <ChairDashboard conferenceId={selectedConferenceId} />
            )}

            {/* Multi-Role Dashboard - Show if user has multiple roles */}
            {((permissions.isAuthor && permissions.isReviewer) ||
              (permissions.isAuthor && permissions.isChair && !permissions.isAdmin)) && (
              <>
                {/* Author Section */}
                {permissions.isAuthor && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Yazar Görünümü</h2>
                    <AuthorDashboard />
                  </div>
                )}

                {/* Reviewer Section */}
                {permissions.isReviewer && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">İncelemeci Görünümü</h2>
                    <ReviewerDashboard />
                  </div>
                )}

                {/* Chair Section */}
                {permissions.isChair && selectedConferenceId && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Başkan Görünümü</h2>
                    <ChairDashboard conferenceId={selectedConferenceId} />
                  </div>
                )}
              </>
            )}

            {/* Legacy Stats Cards - Only for Admin without conference selection */}
            {permissions.isAdmin && !selectedConferenceId && (
              <>
                <StatsCards />

                <div className="grid gap-6 lg:grid-cols-2">
                  <PapersDonutChart />
                  <ReviewsBarChart />
                </div>

                <TimelineAreaChart />
                <ReviewerLoadTable />
              </>
            )}

            {/* Conference List for context */}
            {conferences.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Your Conferences
                  </CardTitle>
                  <CardDescription>Switch between your active conferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {conferences.slice(0, 5).map((conference) => (
                      <div
                        key={conference.id}
                        className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent cursor-pointer ${
                          conference.id === selectedConferenceId
                            ? "border-primary bg-accent"
                            : ""
                        }`}
                        onClick={() =>
                          useDashboardStore.getState().setSelectedConference(conference.id)
                        }
                      >
                        <div>
                          <h4 className="font-semibold">{conference.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {conference.location || "Online"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <p className="text-muted-foreground">
                              {new Date(conference.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          {conference.id === selectedConferenceId ? (
                            <Badge>Selected</Badge>
                          ) : (
                            <Badge variant="outline">
                              {conference.status || "Active"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
