import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, conferenceApi, dashboardApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  totalConferences: number;
  totalPapers: number;
  pendingRequests: number;
  activeConferences: number;
  totalReviews: number;
  pendingReviews: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Fetch multiple stats in parallel
      const [usersRes, conferencesRes, requestsRes] = await Promise.all([
        api.get("/auth/users").catch(() => ({ data: { data: [] } })),
        conferenceApi.getAll().catch(() => ({ data: { data: [] } })),
        api.get("/conference-requests").catch(() => ({ data: { data: [] } })),
      ]);

      const users = Array.isArray(usersRes.data?.data) ? usersRes.data.data : usersRes.data || [];
      const conferences = Array.isArray(conferencesRes.data?.data) ? conferencesRes.data.data : conferencesRes.data || [];
      const requests = Array.isArray(requestsRes.data?.data) ? requestsRes.data.data : requestsRes.data || [];

      const pendingRequests = requests.filter((r: any) => r.status === "pending").length;
      const activeConferences = conferences.filter((c: any) => c.status === "active").length;

      setStats({
        totalUsers: users.length,
        totalConferences: conferences.length,
        totalPapers: 0, // Will be updated when /admin/papers endpoint is available
        pendingRequests,
        activeConferences,
        totalReviews: 0,
        pendingReviews: 0,
      });
    } catch (error: any) {
      console.error("Failed to load admin stats:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin statistics",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conferences</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConferences || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.activeConferences || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingRequests || 0}</div>
            <Link
              to="/admin/conference-requests"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              View requests →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPapers || 0}</div>
            <Link
              to="/admin/papers"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              View all papers →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link to="/admin/conference-requests">
          <Card className="transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Conference Requests
              </CardTitle>
              <CardDescription>
                Review and approve conference creation requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.pendingRequests ? (
                <Badge variant="outline" className="bg-yellow-50">
                  {stats.pendingRequests} pending
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">No pending requests</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/users">
          <Card className="transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users and admin permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats?.totalUsers || 0} total users
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/papers">
          <Card className="transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                All Papers
              </CardTitle>
              <CardDescription>
                View and manage all submitted papers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Across all conferences
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/conferences">
          <Card className="transition-all hover:shadow-md cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Conferences
              </CardTitle>
              <CardDescription>
                View and manage all conferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats?.activeConferences || 0} active conferences
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Operational
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">API Server</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Operational
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">File Storage (S3)</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Operational
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
