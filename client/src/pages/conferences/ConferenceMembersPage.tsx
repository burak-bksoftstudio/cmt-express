import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimpleToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { conferenceApi, conferenceMembersApi, invitationApi } from "@/lib/api";
import { Conference, ConferenceMember, MemberRole } from "@/types";
import {
  MemberList,
  RemoveMemberDialog,
  SendInvitationDialog,
} from "@/components/conference-members";
import { ArrowLeft, Plus, Users, Calendar, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ConferenceMembersPage() {
  const params = useParams();
  const { user, permissions } = useAuth();
  const { addToast, ToastRenderer } = useSimpleToast();
  const conferenceId = params.id as string;

  // State
  const [conference, setConference] = useState<Conference | null>(null);
  const [members, setMembers] = useState<ConferenceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<ConferenceMember | null>(null);

  // Check if current user is a chair (multi-role support)
  const isChair = members.some((m) => m.userId === user?.id && m.role === "CHAIR") || permissions.isAdmin;

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [confResponse, membersResponse] = await Promise.all([
        conferenceApi.getById(conferenceId),
        conferenceMembersApi.getMembers(conferenceId),
      ]);
      setConference(confResponse.data.data);
      setMembers(membersResponse.data.data || []);
    } catch (error) {
      addToast({
        type: "error",
        title: "Load Error",
        description: "Failed to load conference members",
      });
    } finally {
      setLoading(false);
    }
  }, [conferenceId, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Send invitation (renamed from handleAddMember)
  const handleSendInvitation = async (email: string, role: MemberRole, message?: string) => {
    try {
      setActionLoading(true);
      await invitationApi.sendInvitation(conferenceId, { inviteeEmail: email, role, message });
      setInviteModalOpen(false);
      addToast({
        type: "success",
        title: "Invitation Sent",
        description: `Invitation email sent to ${email}. They will be added once they accept.`,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to send invitation";
      addToast({
        type: "error",
        title: "Send Error",
        description: message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Update member role
  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    try {
      setActionLoading(true);
      const response = await conferenceMembersApi.updateMember(conferenceId, memberId, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? response.data.data : m))
      );
      addToast({
        type: "success",
        title: "Role Updated",
        description: "Member role has been updated",
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update role";
      addToast({
        type: "error",
        title: "Update Error",
        description: message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Remove member
  const handleRemove = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      setMemberToRemove(member);
      setRemoveDialogOpen(true);
    }
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;

    try {
      setActionLoading(true);
      await conferenceMembersApi.removeMember(conferenceId, memberToRemove.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      setRemoveDialogOpen(false);
      setMemberToRemove(null);
      addToast({
        type: "success",
        title: "Member Removed",
        description: "Member has been removed from the conference",
      });
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to remove member";
      addToast({
        type: "error",
        title: "Remove Error",
        description: message,
      });
    } finally {
      setActionLoading(false);
    }
  };


  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!conference) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">Conference not found</p>
          <Link to="/conferences">
            <Button variant="link">Back to Conferences</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/conferences/${conferenceId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Members</h1>
              <p className="text-muted-foreground">{conference.name}</p>
            </div>
          </div>

          {isChair && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => setInviteModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </motion.div>
          )}
        </div>

        {/* Conference Info Card */}
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{conference.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(conference.startDate)} - {formatDate(conference.endDate)}
                </span>
                {conference.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {conference.location}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{members.length}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Member List</CardTitle>
            <CardDescription>
              {isChair ? "Manage conference members and their roles" : "View conference members"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberList
              members={members}
              canManage={isChair}
              onRoleChange={handleRoleChange}
              onRemove={handleRemove}
            />
          </CardContent>
        </Card>

        {/* Modals */}
        <SendInvitationDialog
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          onSend={handleSendInvitation}
          loading={actionLoading}
        />

        <RemoveMemberDialog
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          member={memberToRemove}
          onConfirm={confirmRemove}
          loading={actionLoading}
        />

        {/* Toast Renderer */}
        <ToastRenderer />
      </div>
    </DashboardLayout>
  );
}
