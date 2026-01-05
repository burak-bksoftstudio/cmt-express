import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle, XCircle, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ConferenceRequest {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
  adminComment?: string;
}

export default function MyConferenceRequestsPage() {
  const [requests, setRequests] = useState<ConferenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/conference-requests/my");
      const data = response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load my requests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load your conference requests",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Conference Requests</h1>
            <p className="text-muted-foreground">
              Track the status of your conference creation requests
            </p>
          </div>
          <Link to="/conference-requests/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-yellow-500" />
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-yellow-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{request.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Submitted {new Date(request.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {request.startDate && (
                      <div>
                        <span className="font-medium">Start Date:</span>{" "}
                        {new Date(request.startDate).toLocaleDateString()}
                      </div>
                    )}
                    {request.endDate && (
                      <div>
                        <span className="font-medium">End Date:</span>{" "}
                        {new Date(request.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-700">
                      Your request is awaiting admin review. You'll be notified once it's processed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Processed Requests ({processedRequests.length})
          </h2>
          <div className="grid gap-4">
            {processedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{request.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Submitted {new Date(request.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                  )}

                  {request.adminComment && (
                    <div
                      className={`mt-4 p-3 rounded-md ${
                        request.status === "approved"
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">Admin Response:</p>
                      <p className="text-sm">{request.adminComment}</p>
                    </div>
                  )}

                  {request.status === "approved" && (
                    <div className="mt-4">
                      <Link to="/conferences">
                        <Button variant="outline" size="sm">
                          View My Conferences →
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {requests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Conference Requests</h3>
            <p className="text-muted-foreground mb-6">
              You haven't submitted any conference creation requests yet.
            </p>
            <Link to="/conference-requests/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Request
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
