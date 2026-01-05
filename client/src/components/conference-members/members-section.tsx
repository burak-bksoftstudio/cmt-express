import { t } from "@/lib/i18n";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimpleToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/use-auth";
import { conferenceMembersApi, invitationApi } from "@/lib/api";
import { ConferenceMember, MemberRole } from "@/types";
import { MemberList } from "./member-list";
import { SendInvitationDialog } from "./send-invitation-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";
import { Users, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface MembersSectionProps {
  conferenceId: string;
}

export function MembersSection({ conferenceId }: MembersSectionProps) {
  // Toast messages - using hardcoded strings for now
  const { user, permissions } = useAuth();
  const { addToast, ToastRenderer } = useSimpleToast();

  // State
  const [members, setMembers] = useState<ConferenceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<ConferenceMember | null>(null);

  // Check if current user is a chair (handle both uppercase and lowercase roles)
  const currentUserMember = members.find((m) => m.userId === user?.id);
  const isChair = currentUserMember?.role?.toUpperCase() === "CHAIR" || permissions.isAdmin;

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await conferenceMembersApi.getMembers(conferenceId);
      const data = response.data.data || [];
      setMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Send invitation (replaced direct add member)
  const handleSendInvitation = async (email: string, role: MemberRole, message?: string) => {
    try {
      setActionLoading(true);
      await invitationApi.sendInvitation(conferenceId, { inviteeEmail: email, role, message });
      setInviteModalOpen(false);
      addToast({
        type: "success",
        title: "Invitation Sent",
        description: `Invitation sent to ${email}. They will be added once they accept.`,
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
        title: t("roleSuccess.title"),
        description: t("roleSuccess.description"),
      });
    } catch (error: any) {
      const message = error.response?.data?.message || t("roleError.fallback");
      addToast({
        type: "error",
        title: t("roleError.title"),
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
        title: t("removeSuccess.title"),
        description: t("removeSuccess.description"),
      });
    } catch (error: any) {
      const message = error.response?.data?.message || t("removeError.fallback");
      addToast({
        type: "error",
        title: t("removeError.title"),
        description: message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("title", { count: members.length })}
              </CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isChair && (
                <Button size="sm" onClick={() => setInviteModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("actions.add")}
                </Button>
              )}
              <Link to={`/conferences/${conferenceId}/members`}>
                <Button variant="outline" size="sm">
                  {t("actions.viewAll")}
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
              {isChair && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setInviteModalOpen(true)}
                  className="mt-2"
                >
                  {t("actions.addFirst")}
                </Button>
              )}
            </div>
          ) : (
            <MemberList
              members={members.slice(0, 5)} // Show only first 5
              canManage={isChair}
              onRoleChange={handleRoleChange}
              onRemove={handleRemove}
            />
          )}
          
          {members.length > 5 && (
            <div className="mt-4 text-center">
              <Link to={`/conferences/${conferenceId}/members`}>
                <Button variant="ghost" size="sm">
                  {t("actions.viewCount", { count: members.length })}
                </Button>
              </Link>
            </div>
          )}
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
    </>
  );
}

