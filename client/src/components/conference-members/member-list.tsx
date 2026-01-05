import { t } from "@/lib/i18n";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConferenceMember, MemberRole } from "@/types";
import { MemberCard } from "./member-card";
import { Search, Users, Crown, Eye, User } from "lucide-react";

// Map backend roles (lowercase) to frontend MemberRole (uppercase)
const roleMap: Record<string, MemberRole> = {
  chair: "CHAIR",
  reviewer: "REVIEWER",
  author: "AUTHOR",
  member: "AUTHOR",
};

const normalizeRole = (role: string | undefined): MemberRole => {
  return roleMap[role?.toLowerCase() || ""] || "AUTHOR";
};

interface MemberListProps {
  members: ConferenceMember[];
  canManage: boolean;
  onRoleChange: (memberId: string, newRole: MemberRole) => void;
  onRemove: (memberId: string) => void;
}

export function MemberList({
  members,
  canManage,
  onRoleChange,
  onRemove,
}: MemberListProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRole | "ALL">("ALL");

  // Group members by user (multi-role support)
  const groupedMembers = useMemo(() => {
    const grouped = new Map<string, ConferenceMember[]>();

    members.forEach((member) => {
      const userId = member.userId;
      if (!grouped.has(userId)) {
        grouped.set(userId, []);
      }
      grouped.get(userId)!.push(member);
    });

    return Array.from(grouped.values()).map((memberGroup) => ({
      ...memberGroup[0], // Use first member for user info
      roles: memberGroup.map((m) => normalizeRole(m.role)),
      memberIds: memberGroup.map((m) => m.id),
    }));
  }, [members]);

  // Filter and sort grouped members
  const filteredMembers = useMemo(() => {
    let filtered = groupedMembers;

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.user?.firstName.toLowerCase().includes(searchLower) ||
          m.user?.lastName.toLowerCase().includes(searchLower) ||
          m.user?.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (roleFilter !== "ALL") {
      filtered = filtered.filter((m) => m.roles.includes(roleFilter));
    }

    return filtered;
  }, [groupedMembers, search, roleFilter]);

  // Stats (unique users per role)
  const stats = useMemo(() => {
    return {
      total: groupedMembers.length,
      chairs: groupedMembers.filter((m) => m.roles.includes("CHAIR")).length,
      reviewers: groupedMembers.filter((m) => m.roles.includes("REVIEWER")).length,
      authors: groupedMembers.filter((m) => m.roles.includes("AUTHOR")).length,
    };
  }, [groupedMembers]);

  const roleFilters: { value: MemberRole | "ALL"; label: string; count: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "ALL", label: t("filters.all"), count: stats.total, icon: Users },
    { value: "CHAIR", label: t("filters.chairs"), count: stats.chairs, icon: Crown },
    { value: "REVIEWER", label: t("filters.reviewers"), count: stats.reviewers, icon: Eye },
    { value: "AUTHOR", label: t("filters.authors"), count: stats.authors, icon: User },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        <div className="flex flex-wrap gap-2">
          {roleFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = roleFilter === filter.value;
            return (
              <motion.button
                key={filter.value}
                onClick={() => setRoleFilter(filter.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-accent"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="h-4 w-4" />
                {filter.label}
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-1 h-5 min-w-[20px] justify-center"
                >
                  {filter.count}
                </Badge>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Member List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredMembers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">{t("empty.title")}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? t("empty.search") : t("empty.default")}
              </p>
            </motion.div>
          ) : (
            filteredMembers.map((member, index) => (
              <MemberCard
                key={member.id}
                member={member}
                canManage={canManage}
                onRoleChange={onRoleChange}
                onRemove={onRemove}
                index={index}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

