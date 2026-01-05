import { create } from "zustand";
import { dashboardApi, conferenceApi } from "@/lib/api";
import { Conference } from "@/types";

// Dashboard Stats Types
export interface PaperStats {
  total: number;
  submitted: number;
  accepted: number;
  rejected: number;
  cameraReady: number;
}

export interface ReviewStats {
  totalReviews: number;
  averageScore: number;
  averageConfidence: number;
}

export interface ReviewerLoad {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assigned: number;
  completed: number;
}

export interface TimelineEntry {
  date: string;
  submissions: number;
  reviews: number;
}

export interface DashboardStats {
  papers: PaperStats;
  reviews: ReviewStats;
  reviewers: ReviewerLoad[];
  timeline: TimelineEntry[];
}

interface DashboardState {
  // Conference state
  conferences: Conference[];
  selectedConferenceId: string | null;
  conferencesLoading: boolean;

  // Stats state
  stats: DashboardStats | null;
  statsLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  setSelectedConference: (conferenceId: string | null) => void;
  fetchConferences: (isAdmin: boolean) => Promise<void>;
  fetchStats: (conferenceId: string) => Promise<void>;
  clearStats: () => void;
  clearError: () => void;
}

const defaultStats: DashboardStats = {
  papers: {
    total: 0,
    submitted: 0,
    accepted: 0,
    rejected: 0,
    cameraReady: 0,
  },
  reviews: {
    totalReviews: 0,
    averageScore: 0,
    averageConfidence: 0,
  },
  reviewers: [],
  timeline: [],
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  conferences: [],
  selectedConferenceId: null,
  conferencesLoading: false,
  stats: null,
  statsLoading: false,
  error: null,

  // Set selected conference and fetch stats
  setSelectedConference: (conferenceId) => {
    set({ selectedConferenceId: conferenceId });
    if (conferenceId) {
      get().fetchStats(conferenceId);
    } else {
      set({ stats: null });
    }
  },

  // Fetch conferences based on role
  fetchConferences: async (isAdmin) => {
    set({ conferencesLoading: true, error: null });

    try {
      // Admin gets all conferences, others get only their conferences
      const response = isAdmin
        ? await conferenceApi.getAll()
        : await conferenceApi.getMyConferences();

      const conferences = response.data.data || [];
      set({ conferences, conferencesLoading: false });

      // Auto-select logic
      const { selectedConferenceId } = get();

      // If no conference selected and there's exactly one conference, auto-select it
      if (!selectedConferenceId && conferences.length === 1) {
        get().setSelectedConference(conferences[0].id);
      }
      // If there's a previously selected conference, verify it still exists
      else if (selectedConferenceId) {
        const exists = conferences.some((c: Conference) => c.id === selectedConferenceId);
        if (!exists && conferences.length > 0) {
          // Clear selection if the conference no longer exists
          set({ selectedConferenceId: null, stats: null });
        } else if (exists) {
          // Refresh stats for the selected conference
          get().fetchStats(selectedConferenceId);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "Failed to load conferences";
      set({ error: message, conferencesLoading: false });
    }
  },

  // Fetch dashboard stats for a conference
  fetchStats: async (conferenceId) => {
    set({ statsLoading: true, error: null });

    try {
      const response = await dashboardApi.getConferenceStats(conferenceId);
      const data = response.data.data || response.data;

      // Map the API response to our stats structure
      const stats: DashboardStats = {
        papers: {
          total: data.papers?.total || 0,
          submitted: data.papers?.submitted || 0,
          accepted: data.papers?.accepted || 0,
          rejected: data.papers?.rejected || 0,
          cameraReady: data.papers?.cameraReady || 0,
        },
        reviews: {
          totalReviews: data.reviews?.totalReviews || 0,
          averageScore: data.reviews?.averageScore || 0,
          averageConfidence: data.reviews?.averageConfidence || 0,
        },
        reviewers: data.reviewers || [],
        timeline: data.timeline || [],
      };

      set({ stats, statsLoading: false });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message || "Failed to load dashboard stats";
      set({ error: message, statsLoading: false, stats: defaultStats });
    }
  },

  // Clear stats
  clearStats: () => {
    set({ stats: null, selectedConferenceId: null });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
