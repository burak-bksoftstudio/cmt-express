import { t } from "@/lib/i18n";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConferenceMember, MemberRole } from "@/types";
import { Crown, Eye, User, ChevronDown, Trash2, MoreHorizontal, Star } from "lucide-react";

interface MemberCardProps {
  member: ConferenceMember & { roles?: MemberRole[]; memberIds?: string[] };
  canManage: boolean;
  onRoleChange: (memberId: string, newRole: MemberRole) => void;
  onRemove: (memberId: string) => void;
  index: number;
}

// 🔧 FIXED ROLE CONFIG — Backend rolleriyle %100 uyumlu
const roleConfig: Record<MemberRole, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  CHAIR: {
    label: "",
    icon: Crown,
    color: "bg-purple-600/15 text-purple-700 dark:text-purple-300",
  },
  META_REVIEWER: {
    label: "",
    icon: Star,
    color: "bg-yellow-600/15 text-yellow-700 dark:text-yellow-300",
  },
  REVIEWER: {
    label: "",
    icon: Eye,
    color: "bg-blue-600/15 text-blue-700 dark:text-blue-300",
  },
  AUTHOR: {
    label: "",
    icon: User,
    color: "bg-green-600/15 text-green-700 dark:text-green-300",
  },
};

// Map backend roles to frontend MemberRole
const roleMap: Record<string, MemberRole> = {
  chair: "CHAIR",
  meta_reviewer: "META_REVIEWER",
  reviewer: "REVIEWER",
  author: "AUTHOR",
  member: "AUTHOR", // default lowest role
};

export function MemberCard({
  member,
  canManage,
  onRoleChange,
  onRemove,
  index,
}: MemberCardProps) {
  // Multi-role support: Use roles array if available, otherwise fallback to single role
  const userRoles = member.roles || [roleMap[member.role?.toLowerCase()] || "AUTHOR"];
  const memberIds = member.memberIds || [member.id];

  const initials = member.user
    ? `${member.user.firstName[0]}${member.user.lastName[0]}`
    : "?";

  // Handle role toggle (add/remove role)
  const handleRoleToggle = (role: MemberRole) => {
    if (userRoles.includes(role)) {
      // Role exists - find and remove it
      const roleIndex = userRoles.indexOf(role);
      const memberIdToRemove = memberIds[roleIndex];
      onRemove(memberIdToRemove);
    } else {
      // Role doesn't exist - add it
      // Use first member ID as a reference (the actual backend will handle adding the new role)
      onRoleChange(memberIds[0], role);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md"
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">
            {member.user?.firstName} {member.user?.lastName}
          </p>
          {member.user?.isAdmin && (
            <Badge variant="outline" className="text-xs shrink-0">
              {t("badges.admin")}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {member.user?.email}
        </p>
      </div>

      {/* Role Badges / Dropdown */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="flex gap-1">
                  {userRoles.map((role) => {
                    const RoleIcon = roleConfig[role].icon;
                    return (
                      <RoleIcon key={role} className="h-4 w-4" />
                    );
                  })}
                </div>
                Roles ({userRoles.length})
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(roleConfig) as MemberRole[]).map((role) => {
                const roleConf = {
                  ...roleConfig[role],
                  label: t(`role.${role.toLowerCase()}`),
                };
                const Icon = roleConf.icon;
                const hasRole = userRoles.includes(role);
                return (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => handleRoleToggle(role)}
                    className={hasRole ? "bg-accent" : ""}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {roleConf.label}
                    {hasRole && " ✓"}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            {userRoles.map((role) => {
              const config = {
                ...roleConfig[role],
                label: t(`role.${role.toLowerCase()}`),
              };
              const RoleIcon = config.icon;
              return (
                <Badge key={role} className={`gap-1.5 ${config.color}`}>
                  <RoleIcon className="h-3.5 w-3.5" />
                  {config.label}
                </Badge>
              );
            })}
          </>
        )}

        {/* Remove Button */}
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  // Remove all roles for this user
                  memberIds.forEach((id) => onRemove(id));
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("actions.remove")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.div>
  );
}

