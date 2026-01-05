import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children?: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ("admin" | "chair" | "reviewer" | "author")[];
}

export function AuthGuard({
  children,
  requireAuth = true,
  allowedRoles,
}: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const { isLoaded, isSignedIn } = useUser();

  const { user, permissions, setUser, setRoles, setLoading, clearAuth } =
    useAuthStore();

  const [isReady, setIsReady] = useState(false);

  // Initialize auth and check access in a single effect
  useEffect(() => {
    const initAndCheck = async () => {
      if (!isLoaded) return;

      // If not signed in and auth required, redirect to sign-in
      if (requireAuth && !isSignedIn) {
        navigate(`/sign-in?redirect=${encodeURIComponent(pathname)}`, {
          replace: true,
        });
        setIsReady(true);
        return;
      }

      // If signed in on auth pages, redirect to dashboard
      if (
        !requireAuth &&
        isSignedIn &&
        (pathname === "/sign-in" || pathname === "/sign-up")
      ) {
        navigate("/dashboard", { replace: true });
        setIsReady(true);
        return;
      }

      // If signed in but no user data yet, fetch it
      if (isSignedIn && !user) {
        try {
          const response = await authApi.getMe();
          const data = response.data.data || response.data;
          setUser(data.user);
          if (data.memberships) {
            const transformedRoles = data.memberships.map(
              (m: { conferenceId: string; role: string }) => ({
                conferenceId: m.conferenceId,
                role: m.role.toLowerCase(),
              })
            );
            setRoles(transformedRoles);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          clearAuth();
        }
      } else if (!isSignedIn) {
        clearAuth();
      }

      setLoading(false);
      setIsReady(true);
    };

    initAndCheck();
  }, [isLoaded, isSignedIn, user, pathname, requireAuth]);

  // Check role-based access after user is loaded
  useEffect(() => {
    if (!isReady || !user || !allowedRoles || allowedRoles.length === 0) return;

    const hasAccess = allowedRoles.some((role) => {
      if (role === "admin") return permissions.isAdmin;
      if (role === "chair") return permissions.isChair;
      if (role === "reviewer") return permissions.isReviewer;
      if (role === "author") return permissions.isAuthor;
      return false;
    });

    if (!hasAccess) {
      navigate("/dashboard", { replace: true });
    }
  }, [isReady, user, permissions, allowedRoles, navigate]);

  if (!isLoaded || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children || <Outlet />}</>;
}
