import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ConferenceCard } from "@/components/conferences/conference-card";
import { useAuth } from "@/hooks/use-auth";
import { conferenceApi } from "@/lib/api";
import { Conference, ConferenceRole } from "@/types";
import {
  Calendar,
  Plus,
  AlertCircle,
  RefreshCw,
  Archive,
} from "lucide-react";

interface ConferenceWithRole extends Conference {
  userRole?: ConferenceRole["role"];
  _count?: {
    papers: number;
  };
}

export default function ConferencesPage() {
  const { permissions } = useAuth();
  const [conferences, setConferences] = useState<ConferenceWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const fetchConferences = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await conferenceApi.getAll();
      setConferences(response.data.data || []);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load conferences";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConferences();
  }, []);

  const getConferenceStatus = (conference: Conference) => {
    const now = new Date();
    const start = new Date(conference.startDate);
    const end = new Date(conference.endDate);

    if (now < start) return { label: "Upcoming", variant: "secondary" as const };
    if (now >= start && now <= end) return { label: "Active", variant: "default" as const };
    return { label: "Completed", variant: "outline" as const };
  };

  const getUserRoleForConference = (conference: ConferenceWithRole): ConferenceRole["role"] | null => {
    return conference.userRole || null;
  };

  // Filter out archived conferences unless showArchived is true
  const filteredConferences = showArchived
    ? conferences
    : conferences.filter(c => c.status !== "archived");

  const activeConferences = filteredConferences.filter(c => c.status !== "archived" && getConferenceStatus(c).label === "Active");
  const upcomingConferences = filteredConferences.filter(c => c.status !== "archived" && getConferenceStatus(c).label === "Upcoming");
  const completedConferences = filteredConferences.filter(c => c.status !== "archived" && getConferenceStatus(c).label === "Completed");
  const archivedConferences = filteredConferences.filter(c => c.status === "archived");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conferences</h1>
            <p className="text-muted-foreground">Manage and view your conferences</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="cursor-pointer flex items-center gap-1">
                <Archive className="h-4 w-4" />
                Show Archived
              </Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchConferences} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {!permissions.isAdmin && (
                <Link to="/conference-requests/create">
                  <Button variant="default">
                    <Plus className="mr-2 h-4 w-4" />
                    Request Conference
                  </Button>
                </Link>
              )}
              {permissions.isAdmin && (
                <Link to="/conferences/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Conference
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : conferences.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No Conferences</h3>
              <p className="mt-2 max-w-sm text-center text-muted-foreground">
                {permissions.isAdmin
                  ? "Create your first conference to get started."
                  : "No active conferences available. Request to organize your own conference!"}
              </p>
              <div className="mt-6">
                {!permissions.isAdmin && (
                  <Link to="/conference-requests/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Request Conference
                    </Button>
                  </Link>
                )}
                {permissions.isAdmin && (
                  <Link to="/conferences/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Conference
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Conferences Section */}
            {activeConferences.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Active</h2>
                  <Badge variant="default">{activeConferences.length}</Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeConferences.map((conference) => (
                    <ConferenceCard
                      key={conference.id}
                      conference={conference}
                      userRole={getUserRoleForConference(conference)}
                      isAdmin={permissions.isAdmin}
                      isChair={permissions.isChair}
                      papersCount={conference._count?.papers}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Conferences Section */}
            {upcomingConferences.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Upcoming</h2>
                  <Badge variant="secondary">{upcomingConferences.length}</Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingConferences.map((conference) => (
                    <ConferenceCard
                      key={conference.id}
                      conference={conference}
                      userRole={getUserRoleForConference(conference)}
                      isAdmin={permissions.isAdmin}
                      isChair={permissions.isChair}
                      papersCount={conference._count?.papers}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Conferences Section */}
            {completedConferences.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">Completed</h2>
                  <Badge variant="outline">{completedConferences.length}</Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {completedConferences.map((conference) => (
                    <ConferenceCard
                      key={conference.id}
                      conference={conference}
                      userRole={getUserRoleForConference(conference)}
                      isAdmin={permissions.isAdmin}
                      isChair={permissions.isChair}
                      papersCount={conference._count?.papers}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Archived Conferences Section */}
            {showArchived && archivedConferences.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-yellow-600" />
                  <h2 className="text-xl font-semibold">Archived</h2>
                  <Badge variant="outline" className="border-yellow-500">{archivedConferences.length}</Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {archivedConferences.map((conference) => (
                    <ConferenceCard
                      key={conference.id}
                      conference={conference}
                      userRole={getUserRoleForConference(conference)}
                      isAdmin={permissions.isAdmin}
                      isChair={permissions.isChair}
                      papersCount={conference._count?.papers}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredConferences.filter(c => c.status !== "archived").length}</div>
                  {showArchived && archivedConferences.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      +{archivedConferences.length} archived
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeConferences.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingConferences.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <div className="h-2 w-2 rounded-full bg-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedConferences.length}</div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
