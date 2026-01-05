import { create } from "zustand";
import { User, ConferenceRole, UserPermissions, UserStats } from "@/types";

interface AuthState {
  user: User | null;
  roles: ConferenceRole[];
  isLoading: boolean;
  permissions: UserPermissions;
  stats: UserStats;

  // Actions
  setUser: (user: User | null) => void;
  setRoles: (roles: ConferenceRole[]) => void;
  setPermissions: (permissions: UserPermissions) => void;
  setStats: (stats: UserStats) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  hasRoleForConference: (
    conferenceId: string,
    role: ConferenceRole["role"]
  ) => boolean;
  isChairOfConference: (conferenceId: string) => boolean;
  isReviewerOfConference: (conferenceId: string) => boolean;
}

const calculatePermissions = (
  user: User | null,
  roles: ConferenceRole[]
): UserPermissions => {
  const conferenceRoles = new Map<string, ConferenceRole["role"][]>();

  roles.forEach((role) => {
    const existing = conferenceRoles.get(role.conferenceId) || [];
    if (!existing.includes(role.role)) {
      existing.push(role.role);
    }
    conferenceRoles.set(role.conferenceId, existing);
  });

  return {
    isAdmin: user?.isAdmin || false,
    isChair: roles.some((r) => r.role === "chair"),
    isReviewer: roles.some((r) => r.role === "reviewer"),
    isAuthor: roles.some((r) => r.role === "author"),
    conferenceRoles,
  };
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  roles: [],
  isLoading: true,
  permissions: {
    isAdmin: false,
    isChair: false,
    isReviewer: false,
    isAuthor: false,
    conferenceRoles: new Map(),
  },
  stats: {
    hasRequests: false,
    hasPapers: false,
    hasInvitations: false,
    hasReviewAssignments: false,
    hasConferences: false,
  },

  setUser: (user) => {
    const { roles } = get();
    set({
      user,
      permissions: calculatePermissions(user, roles),
    });
  },

  setRoles: (roles) => {
    const { user } = get();
    set({
      roles,
      permissions: calculatePermissions(user, roles),
    });
  },

  setPermissions: (permissions) => {
    set({ permissions });
  },

  setStats: (stats) => {
    set({ stats });
  },

  clearAuth: () => {
    // Clear conference selection when logging out
    try {
      localStorage.removeItem('conference-context');
    } catch (e) {
      // Ignore localStorage errors
    }
    
    set({
      user: null,
      roles: [],
      permissions: {
        isAdmin: false,
        isChair: false,
        isReviewer: false,
        isAuthor: false,
        conferenceRoles: new Map(),
      },
      stats: {
        hasRequests: false,
        hasPapers: false,
        hasInvitations: false,
        hasReviewAssignments: false,
        hasConferences: false,
      },
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  hasRoleForConference: (conferenceId, role) => {
    const { permissions, user } = get();
    if (user?.isAdmin) return true;
    const conferenceRoles = permissions.conferenceRoles.get(conferenceId);
    return conferenceRoles?.includes(role) || false;
  },

  isChairOfConference: (conferenceId) => {
    return get().hasRoleForConference(conferenceId, "chair");
  },

  isReviewerOfConference: (conferenceId) => {
    return get().hasRoleForConference(conferenceId, "reviewer");
  },
}));
