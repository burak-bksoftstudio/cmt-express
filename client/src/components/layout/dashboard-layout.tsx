
import { useUIStore } from "@/stores/ui-store";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { AuthGuard } from "./auth-guard";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "chair" | "reviewer" | "author")[];
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const { sidebarOpen } = useUIStore();
  const { isAuthenticated, isLoading } = useAuth();

  // Calculate sidebar padding only when authenticated
  const showSidebar = isAuthenticated && !isLoading;

  return (
    <AuthGuard requireAuth={true} allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Topbar />
        <main
          className={cn(
            "min-h-screen pt-16 transition-all duration-300",
            showSidebar && (sidebarOpen ? "pl-64" : "pl-16")
          )}
        >
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}

