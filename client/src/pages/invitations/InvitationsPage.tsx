import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimpleToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { invitationApi } from "@/lib/api";
import { Mail, Check, X, Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Invitation {
  id: string;
  conferenceId: string;
  role: string;
  message?: string;
  status: string;
  createdAt: string;
  conference: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  inviter: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function InvitationsPage() {
  const { user } = useAuth();
  const { addToast, ToastRenderer } = useSimpleToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await invitationApi.getMyInvitations();
      setInvitations(response.data.data || []);
    } catch (error) {
      addToast({
        type: "error",
        title: "Load Error",
        description: "Failed to load invitations",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await invitationApi.acceptInvitation(invitationId);
      addToast({
        type: "success",
        title: "Invitation Accepted",
        description: "You have successfully joined the conference",
      });
      // Refresh invitations
      await fetchInvitations();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to accept invitation";
      addToast({
        type: "error",
        title: "Accept Error",
        description: message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await invitationApi.declineInvitation(invitationId);
      addToast({
        type: "success",
        title: "Invitation Declined",
        description: "You have declined the invitation",
      });
      // Refresh invitations
      await fetchInvitations();
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to decline invitation";
      addToast({
        type: "error",
        title: "Decline Error",
        description: message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toUpperCase()) {
      case "CHAIR":
        return "default";
      case "REVIEWER":
        return "secondary";
      case "AUTHOR":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "default";
      case "ACCEPTED":
        return "secondary";
      case "DECLINED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === "PENDING");
  const processedInvitations = invitations.filter((inv) => inv.status !== "PENDING");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>
          <p className="text-muted-foreground">Manage your conference invitations</p>
        </div>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
              {pendingInvitations.length > 0 && (
                <Badge variant="destructive">{pendingInvitations.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Invitations waiting for your response
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInvitations.map((invitation, index) => (
                  <motion.div
                    key={invitation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-lg">
                          {invitation.conference.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(invitation.conference.startDate)} -{" "}
                          {formatDate(invitation.conference.endDate)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          Invited by: {invitation.inviter.firstName} {invitation.inviter.lastName}
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeVariant(invitation.role)}>
                        {invitation.role}
                      </Badge>
                    </div>

                    {invitation.message && (
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-sm text-muted-foreground italic">
                          "{invitation.message}"
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleAccept(invitation.id)}
                        disabled={actionLoading === invitation.id}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDecline(invitation.id)}
                        disabled={actionLoading === invitation.id}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processed Invitations */}
        {processedInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Invitation History</CardTitle>
              <CardDescription>
                Previously accepted or declined invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{invitation.conference.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Role: {invitation.role}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(invitation.status)}>
                      {invitation.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toast Renderer */}
        <ToastRenderer />
      </div>
    </DashboardLayout>
  );
}
