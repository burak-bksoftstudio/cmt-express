import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api";

export function useAuth() {
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const store = useAuthStore();
  const {
    user,
    roles,
    permissions,
    stats,
    isLoading,
    setUser,
    setRoles,
    setStats,
    clearAuth,
    setLoading,
    hasRoleForConference,
    isChairOfConference,
    isReviewerOfConference,
  } = store;

  // Sync Clerk auth state with local store
  useEffect(() => {
    const syncUser = async () => {
      if (!clerkLoaded) return;

      if (!isSignedIn) {
        clearAuth();
        setLoading(false);
        return;
      }

      // Only fetch if we don't have user data yet
      if (!user) {
        try {
          const response = await authApi.getMe();
          const data = response.data.data || response.data;
          setUser(data.user);
          if (data.memberships) {
            // Transform memberships to match the expected role format
            const transformedRoles = data.memberships.map(
              (m: { conferenceId: string; role: string }) => ({
                conferenceId: m.conferenceId,
                role: m.role.toLowerCase(),
              })
            );
            setRoles(transformedRoles);
          }
          // Set stats for dynamic sidebar
          if (data.stats) {
            setStats(data.stats);
          }
        } catch (error) {
          console.error("Failed to sync user data:", error);
          clearAuth();
        }
      }
      setLoading(false);
    };

    syncUser();
  }, [clerkLoaded, isSignedIn, clerkUser?.id, user]);

  const logout = useCallback(async () => {
    await signOut();
    clearAuth();
    navigate("/sign-in");
  }, [signOut, clearAuth, navigate]);

  return {
    user,
    roles,
    isAuthenticated: isSignedIn ?? false,
    isLoading: !clerkLoaded || isLoading,
    permissions,
    stats,
    logout,
    hasRoleForConference,
    isChairOfConference,
    isReviewerOfConference,
  };
}
