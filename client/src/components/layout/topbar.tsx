import { t } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/ui-store";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, User, Settings, Mail, ClipboardList, CheckCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { user, permissions, stats, logout, isAuthenticated, isLoading } = useAuth();
  const { sidebarOpen } = useUIStore();

  // Don't render topbar if not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  const getRoleBadge = () => {
    if (permissions.isAdmin) return <Badge variant="destructive">Admin</Badge>;
    if (permissions.isChair) return <Badge variant="default">Chair</Badge>;
    if (permissions.isReviewer) return <Badge variant="secondary">Reviewer</Badge>;
    if (permissions.isAuthor) return <Badge variant="outline">Author</Badge>;
    return null;
  };

  // Calculate topbar position based on sidebar state
  const showSidebar = isAuthenticated && !isLoading;

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur-sm supports-backdrop-filter:bg-background/60 transition-all duration-300",
        showSidebar && (sidebarOpen ? "left-64" : "left-16")
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Conference Management</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {(stats.totalNotifications ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                  {stats.totalNotifications}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Pending Invitations */}
            {(stats.pendingInvitations ?? 0) > 0 && (
              <DropdownMenuItem asChild>
                <Link to="/invitations" className="cursor-pointer flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pending Invitations</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingInvitations} invitation{stats.pendingInvitations !== 1 ? 's' : ''} waiting
                    </p>
                  </div>
                  <Badge variant="secondary">{stats.pendingInvitations}</Badge>
                </Link>
              </DropdownMenuItem>
            )}

            {/* Pending Reviews */}
            {(stats.pendingReviews ?? 0) > 0 && (
              <DropdownMenuItem asChild>
                <Link to="/reviews" className="cursor-pointer flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                    <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Pending Reviews</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingReviews} review{stats.pendingReviews !== 1 ? 's' : ''} to complete
                    </p>
                  </div>
                  <Badge variant="secondary">{stats.pendingReviews}</Badge>
                </Link>
              </DropdownMenuItem>
            )}

            {/* New Decisions */}
            {(stats.newDecisions ?? 0) > 0 && (
              <DropdownMenuItem asChild>
                <Link to="/papers" className="cursor-pointer flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Paper Decisions</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.newDecisions} paper{stats.newDecisions !== 1 ? 's' : ''} with decisions
                    </p>
                  </div>
                  <Badge variant="secondary">{stats.newDecisions}</Badge>
                </Link>
              </DropdownMenuItem>
            )}

            {/* No notifications */}
            {(stats.totalNotifications ?? 0) === 0 && (stats.newDecisions ?? 0) === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user ? getInitials(user.firstName, user.lastName) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start md:flex">
                <span className="text-sm font-medium">
                  {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                </span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium leading-none">
                  {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <div className="pt-1">{getRoleBadge()}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile & Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
