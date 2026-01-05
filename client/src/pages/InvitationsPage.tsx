import { useEffect, useState } from "react";
import { invitationApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle, XCircle, Clock, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { motion } from "framer-motion";

interface Invitation {
  id: string;
  role: "CHAIR" | "REVIEWER" | "AUTHOR";
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  message?: string;
  createdAt: string;
  conference: {
    id: string;
    name: string;
    startDate?: string;
    endDate?: string;
  };
  inviter: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationApi.getMyInvitations();
      const data = response.data?.data || response.data || [];
      setInvitations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to load invitations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to load invitations",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await invitationApi.acceptInvitation(invitationId);
      toast({
        title: "Success",
        description: "Invitation accepted successfully",
      });
      loadInvitations(); // Reload to update status
    } catch (error: any) {
      console.error("Failed to accept invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to accept invitation",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await invitationApi.declineInvitation(invitationId);
      toast({
        title: "Declined",
        description: "Invitation declined",
      });
      loadInvitations(); // Reload to update status
    } catch (error: any) {
      console.error("Failed to decline invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to decline invitation",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "DECLINED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      CHAIR: "bg-purple-100 text-purple-700",
      REVIEWER: "bg-blue-100 text-blue-700",
      AUTHOR: "bg-green-100 text-green-700",
    };
    return (
      <Badge className={colors[role as keyof typeof colors] || "bg-gray-100 text-gray-700"}>
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const pendingInvitations = invitations.filter((i) => i.status === "PENDING");
  const processedInvitations = invitations.filter((i) => i.status !== "PENDING");

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Mail className="h-8 w-8" />
            My Invitations
          </h1>
          <p className="text-muted-foreground">
            Manage invitations to join conferences
          </p>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-yellow-500" />
              Pending Invitations ({pendingInvitations.length})
            </h2>
            <div className="grid gap-4">
              {pendingInvitations.map((invitation, index) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-yellow-200 shadow-xs hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 mb-1">
                            {invitation.conference.name}
                            {getRoleBadge(invitation.role)}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              From: {invitation.inviter.firstName} {invitation.inviter.lastName} ({invitation.inviter.email})
                            </span>
                            {invitation.conference.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(invitation.conference.startDate).toLocaleDateString()}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        {getStatusBadge(invitation.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {invitation.message && (
                        <div className="mb-4 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Message:</p>
                          <p className="text-sm text-muted-foreground">{invitation.message}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAccept(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="flex-1"
                        >
                          {actionLoading === invitation.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDecline(invitation.id)}
                          disabled={actionLoading === invitation.id}
                          className="flex-1"
                        >
                          {actionLoading === invitation.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Declining...
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Decline
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Processed Invitations */}
        {processedInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Processed Invitations ({processedInvitations.length})
            </h2>
            <div className="grid gap-4">
              {processedInvitations.map((invitation, index) => (
                <motion.div
                  key={invitation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="shadow-xs">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 mb-1">
                            {invitation.conference.name}
                            {getRoleBadge(invitation.role)}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              From: {invitation.inviter.firstName} {invitation.inviter.lastName}
                            </span>
                            {invitation.conference.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(invitation.conference.startDate).toLocaleDateString()}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        {getStatusBadge(invitation.status)}
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {invitations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Invitations</h3>
              <p className="text-muted-foreground">
                You don't have any conference invitations at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
