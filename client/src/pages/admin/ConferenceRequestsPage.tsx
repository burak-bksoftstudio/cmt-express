import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConferenceRequest {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  createdAt: string;
  requester: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  adminComment?: string;
}

export default function ConferenceRequestsPage() {
  const [requests, setRequests] = useState<ConferenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/conference-requests");
      const data = response.data?.data || response.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load conference requests",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      await api.post(`/conference-requests/${requestId}/approve`);
      toast({
        title: "Success",
        description: "Conference request approved successfully",
      });
      loadRequests();
    } catch (error: any) {
      console.error("Approve error:", error);
      console.error("Response data:", error.response?.data);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to approve request",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const comment = prompt("Rejection reason (optional):");

    try {
      setActionLoading(requestId);
      await api.post(`/conference-requests/${requestId}/reject`, { comment });
      toast({
        title: "Success",
        description: "Conference request rejected",
      });
      loadRequests();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to reject request",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
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

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Conference Requests</h1>
        <p className="text-muted-foreground">
          Review and approve conference creation requests
        </p>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Pending Requests ({pendingRequests.length})</h2>
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-yellow-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{request.title}</CardTitle>
                      <CardDescription>
                        Requested by {request.requester.firstName} {request.requester.lastName} ({request.requester.email})
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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
                    <div>
                      <span className="font-medium">Requested:</span>{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(request.id)}
                      disabled={actionLoading === request.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoading === request.id}
                      variant="destructive"
                      size="sm"
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Processed Requests ({processedRequests.length})</h2>
          <div className="grid gap-4">
            {processedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{request.title}</CardTitle>
                      <CardDescription>
                        Requested by {request.requester.firstName} {request.requester.lastName} ({request.requester.email})
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {request.description && (
                    <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                  )}
                  {request.adminComment && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Admin Comment:</p>
                      <p className="text-sm text-muted-foreground">{request.adminComment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No conference requests found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
