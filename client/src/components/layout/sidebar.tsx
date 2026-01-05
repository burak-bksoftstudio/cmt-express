import { t } from "@/lib/i18n";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/ui-store";
import { useConferenceStore } from "@/stores/conference-store";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  ClipboardList,
  Target,
  Camera,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Mail,
  FileStack,
  Star,
  MessagesSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "react-router-dom";
import { ConferenceSelector } from "@/components/conference/conference-selector";

// Apple-like easing
const appleEasing = [0.16, 1, 0.3, 1] as const;

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ("admin" | "chair" | "reviewer" | "author" | "meta_reviewer")[];
  requiresConference?: boolean; // Flag for conference-specific items
  hideInAdmin?: boolean; // Hide this item when in admin pages
  showIf?: (stats: any) => boolean; // Dynamic visibility based on user stats
}

// Navigation Item Component
function NavItemLink({
  item,
  isActive,
  isCollapsed,
  index,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        ease: appleEasing,
        delay: index * 0.03,
      }}
    >
      <Link
        to={item.href}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
          !isCollapsed && "pr-4"
        )}
      >
        {/* Active background with animation */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="activeNavBg"
              className="absolute inset-0 rounded-lg bg-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 30,
              }}
            />
          )}
        </AnimatePresence>

        {/* Hover background */}
        {!isActive && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-accent opacity-0 group-hover:opacity-100"
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Active bar indicator (left side) */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/50"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 20, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: appleEasing }}
            />
          )}
        </AnimatePresence>

        {/* Icon with hover scale */}
        <motion.div
          className="relative z-10 flex items-center justify-center"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15, ease: appleEasing }}
        >
          <item.icon className="h-5 w-5 shrink-0" />
        </motion.div>

        {/* Title with fade animation */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              className="relative z-10 truncate"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: appleEasing }}
            >
              {item.title}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  );
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { permissions, stats, isAuthenticated, isLoading, hasRoleForConference } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { activeConferenceId } = useConferenceStore();

  // Check if current route is admin page
  const isAdminPage = pathname.startsWith('/admin');

  const mainNavItems: NavItem[] = [
    {
      title: t("items.dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t("items.conferences"),
      href: "/conferences",
      icon: Calendar,
      showIf: (stats) => stats.hasConferences, // Show only if user is member of any conference
    },
    {
      title: t("items.myPapers"),
      href: "/papers",
      icon: FileText,
      showIf: (stats) => stats.hasPapers, // Show only if user has submitted papers
    },
    {
      title: "Invitations",
      href: "/invitations",
      icon: Mail,
      // Always show - users should be able to check for pending invitations
    },
    {
      title: "My Requests",
      href: "/conference-requests/my",
      icon: FileStack,
      hideInAdmin: true, // Hide from admin users
      showIf: (stats) => stats.hasRequests, // Show only if user has created requests
    },
  ];

  // Conference-specific navigation items (dynamic based on active conference)
  const getConferenceNavItems = (conferenceId: string | null): NavItem[] => {
    if (!conferenceId) return [];

    return [
      {
        title: t("items.bidding"),
        href: `/conferences/${conferenceId}/bidding`,
        icon: Target,
        roles: ["reviewer"],
        requiresConference: true,
        hideInAdmin: true,
      },
      {
        title: "My Reviews",
        href: `/conferences/${conferenceId}/reviews`,
        icon: ClipboardList,
        roles: ["reviewer"],
        requiresConference: true,
        hideInAdmin: true,
        showIf: (stats) => stats.hasReviewAssignments, // Show only if user has review assignments
      },
      {
        title: "Manage Assignments",
        href: `/conferences/${conferenceId}/assignments`,
        icon: ClipboardList,
        roles: ["chair"],
        requiresConference: true,
        hideInAdmin: true,
      },
      {
        title: "Meta-reviews",
        href: "/metareviews",
        icon: Star,
        roles: ["chair", "meta_reviewer"],
        requiresConference: true,
        hideInAdmin: true,
      },
      {
        title: "Camera Ready Approval",
        href: `/conferences/${conferenceId}/camera-ready`,
        icon: Camera,
        roles: ["chair"],
        requiresConference: true,
        hideInAdmin: true,
      },
    ];
  };

  const conferenceNavItems = getConferenceNavItems(activeConferenceId);

  const adminNavItems: NavItem[] = [
    {
      title: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      roles: ["admin"],
    },
    {
      title: "All Conferences",
      href: "/admin/conferences",
      icon: Calendar,
      roles: ["admin"],
    },
    {
      title: "Conference Requests",
      href: "/admin/conference-requests",
      icon: ClipboardList,
      roles: ["admin"],
    },
    {
      title: t("items.allPapers"),
      href: "/admin/papers",
      icon: BookOpen,
      roles: ["admin"],
    },
    {
      title: "All Reviews",
      href: "/admin/reviews",
      icon: FileText,
      roles: ["admin"],
    },
    {
      title: t("items.users"),
      href: "/admin/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      title: t("items.settings"),
      href: "/admin/settings",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  // Don't render sidebar if not authenticated or still loading
  if (isLoading || !isAuthenticated) {
    return null;
  }

  const checkAccess = (item: NavItem): boolean => {
    // Hide items marked as hideInAdmin when in admin pages
    if (isAdminPage && item.hideInAdmin) return false;

    // Hide items marked as hideInAdmin for admin users (regardless of current page)
    if (permissions.isAdmin && item.hideInAdmin) return false;

    // Check dynamic visibility based on user stats
    if (item.showIf && !item.showIf(stats)) return false;

    if (!item.roles) return true;

    // Conference-specific items require conference context
    if (item.requiresConference && activeConferenceId) {
      // Admin has access to all conference items
      if (permissions.isAdmin) return true;
      return item.roles.some((role) => {
        if (role === "admin") return false; // already checked above
        return hasRoleForConference(activeConferenceId, role);
      });
    }

    // Global items check general permissions
    return item.roles.some((role) => {
      if (role === "admin") return permissions.isAdmin;
      if (role === "chair") return permissions.isChair;
      if (role === "reviewer") return permissions.isReviewer;
      if (role === "author") return permissions.isAuthor;
      if (role === "meta_reviewer") {
        // Check if user has META_REVIEWER role in any conference
        // For now, simplified: chairs can be meta-reviewers
        return permissions.isChair;
      }
      return false;
    });
  };

  const isItemActive = (href: string): boolean => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const filteredMainNav = mainNavItems.filter(checkAccess);
  const filteredConferenceNav = conferenceNavItems.filter(checkAccess);
  const filteredAdminNav = adminNavItems.filter(checkAccess);

  return (
    <motion.aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background/95 backdrop-blur-xs"
      )}
      initial={false}
      animate={{
        width: sidebarOpen ? 256 : 64,
      }}
      transition={{
        duration: 0.3,
        ease: appleEasing,
      }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: appleEasing }}
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  <motion.div
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="text-sm font-bold text-primary-foreground">
                      C
                    </span>
                  </motion.div>
                  <span className="text-lg font-semibold">CMT</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 transition-colors duration-200"
            >
              <motion.div
                animate={{ rotate: sidebarOpen ? 0 : 180 }}
                transition={{ duration: 0.3, ease: appleEasing }}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </div>

        {/* Conference Selector - Hide in admin pages and for admin users */}
        {sidebarOpen && !isAdminPage && !permissions.isAdmin && <ConferenceSelector />}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {/* Main Navigation */}
          <div className="space-y-1">
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.p
                  className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2, ease: appleEasing }}
                >
                  {t("main")}
                </motion.p>
              )}
            </AnimatePresence>
            {filteredMainNav.map((item, index) => (
              <NavItemLink
                key={item.href}
                item={item}
                isActive={isItemActive(item.href)}
                isCollapsed={!sidebarOpen}
                index={index}
              />
            ))}
          </div>

          {/* Conference Navigation */}
          {filteredConferenceNav.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Separator className="my-4" />
              </motion.div>
              <div className="space-y-1">
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.p
                      className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2, ease: appleEasing }}
                    >
                      Conference
                    </motion.p>
                  )}
                </AnimatePresence>
                {filteredConferenceNav.map((item, index) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    isActive={isItemActive(item.href)}
                    isCollapsed={!sidebarOpen}
                    index={index + filteredMainNav.length}
                  />
                ))}
              </div>
            </>
          )}

          {/* Admin Navigation */}
          {filteredAdminNav.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Separator className="my-4" />
              </motion.div>
              <div className="space-y-1">
                <AnimatePresence mode="wait">
                  {sidebarOpen && (
                    <motion.p
                      className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2, ease: appleEasing }}
                    >
                      {t("admin")}
                    </motion.p>
                  )}
                </AnimatePresence>
                {filteredAdminNav.map((item, index) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    isActive={isItemActive(item.href)}
                    isCollapsed={!sidebarOpen}
                    index={index + filteredMainNav.length}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Settings */}
        <div className="border-t p-3">
          <NavItemLink
            item={{
              title: t("items.settings"),
              href: "/settings",
              icon: Settings,
            }}
            isActive={pathname === "/settings"}
            isCollapsed={!sidebarOpen}
            index={0}
          />
        </div>
      </div>
    </motion.aside>
  );
}
