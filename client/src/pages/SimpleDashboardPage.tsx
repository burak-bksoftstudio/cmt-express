import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";
import {
  Users,
  FileText,
  Calendar,
  Crown,
  UserCheck,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
} from "lucide-react";

interface Conference {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status: string;
  _count?: {
    papers: number;
  };
}

interface Paper {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  conference: {
    id: string;
    name: string;
  };
  decision?: {
    finalDecision: string;
    decidedAt: string;
  };
  _count: {
    reviewAssignments: number;
    cameraReadyFiles: number;
  };
}

interface DashboardData {
  chairConferences: Conference[];
  reviewerConferences: Conference[];
  authorConferences: Conference[];
  myPapers: Paper[];
}

export default function SimpleDashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardApi.getMyDashboard();
        setData(response.data.data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load dashboard",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [toast]);

  const getPaperStatusBadge = (paper: Paper) => {
    if (paper.decision?.finalDecision === "accept") {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    }
    if (paper.decision?.finalDecision === "reject") {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    if (paper._count.reviewAssignments > 0) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Under Review ({paper._count.reviewAssignments})
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Send className="h-3 w-3 mr-1" />
        Submitted
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load dashboard</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalConferences =
    data.chairConferences.length +
    data.reviewerConferences.length +
    data.authorConferences.length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName || "User"}
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your conference activities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Conferences
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConferences}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                As Chair
              </CardTitle>
              <Crown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.chairConferences.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                As Reviewer
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.reviewerConferences.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                My Papers
              </CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.myPapers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Chair Conferences */}
        {data.chairConferences.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Conferences I Chair
              </h2>
              <Badge variant="secondary">{data.chairConferences.length}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.chairConferences.map((conference) => (
                <ConferenceCard key={conference.id} conference={conference} />
              ))}
            </div>
          </div>
        )}

        {/* Author Conferences */}
        {data.authorConferences.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Conferences I'm Authoring In
              </h2>
              <Badge variant="secondary">{data.authorConferences.length}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.authorConferences.map((conference) => (
                <ConferenceCard key={conference.id} conference={conference} />
              ))}
            </div>
          </div>
        )}

        {/* Reviewer Conferences */}
        {data.reviewerConferences.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-500" />
                Conferences I'm Reviewing For
              </h2>
              <Badge variant="secondary">
                {data.reviewerConferences.length}
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.reviewerConferences.map((conference) => (
                <ConferenceCard key={conference.id} conference={conference} />
              ))}
            </div>
          </div>
        )}

        {/* My Papers */}
        {data.myPapers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Submitted Papers
              </CardTitle>
              <CardDescription>Track the status of your submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.myPapers.map((paper) => (
                  <Link
                    key={paper.id}
                    to={`/papers/${paper.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent">
                      <div className="flex-1">
                        <h4 className="font-semibold line-clamp-1">
                          {paper.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {paper.conference.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted: {new Date(paper.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">{getPaperStatusBadge(paper)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {totalConferences === 0 && data.myPapers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activities Yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Start by browsing active conferences and submitting your research papers
              </p>
              <div className="flex gap-4">
                <Link to="/conferences">
                  <Button>Browse Conferences</Button>
                </Link>
                <Link to="/papers/submit">
                  <Button variant="outline">Submit a Paper</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function ConferenceCard({ conference }: { conference: Conference }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="line-clamp-1 text-base">
          {conference.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {conference.description || "No description available"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {conference.location && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {conference.location}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {new Date(conference.startDate).toLocaleDateString()} -{" "}
          {new Date(conference.endDate).toLocaleDateString()}
        </p>
        {conference._count && (
          <Badge variant="outline">{conference._count.papers} papers</Badge>
        )}
        <Link to={`/conferences/${conference.id}`} className="block">
          <Button variant="outline" size="sm" className="w-full">
            View Conference
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
