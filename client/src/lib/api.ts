import axios, { AxiosError } from "axios";

// Use /api prefix - Vite proxy handles forwarding to Express backend
const API_BASE_URL = "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important: Send cookies for Clerk session
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to Clerk sign-in
      const pathname = window.location.pathname || "/";
      if (
        !pathname.startsWith("/sign-in") &&
        !pathname.startsWith("/sign-up")
      ) {
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API - only /me endpoint now (Clerk handles login/register)
export const authApi = {
  getMe: () => api.get("/auth/me"),
};

// Conference API
export const conferenceApi = {
  getAll: () => api.get("/conferences"),
  getById: (id: string) => api.get(`/conferences/${id}`),
  getMyConferences: () => api.get("/conferences/my"),
  create: (data: { name: string; description?: string; location?: string; startDate: string; endDate: string }) =>
    api.post("/conferences", data),
  update: (id: string, data: Partial<{ name: string; description?: string; location?: string; startDate: string; endDate: string }>) =>
    api.put(`/conferences/${id}`, data),
  updateSettings: (id: string, data: { submissionDeadline?: string; reviewDeadline?: string; maxReviewersPerPaper?: number; assignmentTimeoutDays?: number }) =>
    api.put(`/conferences/${id}/settings`, data),
  assignChair: (id: string, userId: string) =>
    api.post(`/conferences/${id}/assign-chair`, { userId }),
  joinConference: (id: string) =>
    api.post(`/conferences/${id}/join`),
  addUser: (id: string, userId: string) =>
    api.post(`/conferences/${id}/add-user`, { userId }),
  assignReviewer: (id: string, userId: string) =>
    api.post(`/conferences/${id}/assign-reviewer`, { userId }),
  getMembers: (id: string) =>
    api.get(`/conferences/${id}/members`),
  getTracks: (id: string) =>
    api.get(`/conferences/${id}/tracks`),
  createTrack: (id: string, data: { name: string; description?: string }) =>
    api.post(`/conferences/${id}/tracks`, data),
};

// Conference Members API
export type MemberRole = "CHAIR" | "REVIEWER" | "AUTHOR" | "META_REVIEWER";

export const conferenceMembersApi = {
  getMembers: (conferenceId: string) =>
    api.get(`/conferences/${conferenceId}/members`),
  addMember: (conferenceId: string, data: { email: string; role: MemberRole }) =>
    api.post(`/conferences/${conferenceId}/members`, data),
  updateMember: (conferenceId: string, memberId: string, data: { role: MemberRole }) =>
    api.patch(`/conferences/${conferenceId}/members/${memberId}`, data),
  removeMember: (conferenceId: string, memberId: string) =>
    api.delete(`/conferences/${conferenceId}/members/${memberId}`),
};

// Paper API
export const paperApi = {
  getAll: () => api.get("/papers"),
  getMyPapers: (conferenceId?: string) =>
    api.get("/papers/my", { params: conferenceId ? { conferenceId } : {} }),
  getById: (id: string) => api.get(`/papers/${id}`),
  create: (data: { conferenceId: string; trackId?: string; title: string; abstract?: string; keywords?: string[] }) =>
    api.post("/papers", data),
  update: (paperId: string, data: { title?: string; abstract?: string; keywords?: string[]; trackId?: string }) =>
    api.patch(`/papers/${paperId}`, data),
  addAuthors: (paperId: string, authors: { firstName: string; lastName: string; email: string; order: number }[]) =>
    api.post(`/papers/${paperId}/authors`, { authors }),
  uploadFile: (paperId: string, file: File, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/papers/${paperId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(progress);
        }
      },
    });
  },
  deleteFile: (paperId: string, fileId: string) =>
    api.delete(`/papers/${paperId}/files/${fileId}`),
  getDownloadUrl: (paperId: string) => api.get(`/papers/${paperId}/download`),
  // Use reviewAssignmentApi.getForPaper() instead
  getAssignments: (paperId: string) => api.get(`/assignments/papers/${paperId}`),
  // Auto-assign requires conferenceId, use reviewAssignmentApi.autoAssign() instead
  getConferencePapers: (conferenceId: string) => api.get(`/papers`, { params: { conferenceId } }),
};

// Paper Version API
export const paperVersionApi = {
  getVersions: (paperId: string) => api.get(`/papers/${paperId}/versions`),
  getVersion: (paperId: string, version: number) => api.get(`/papers/${paperId}/versions/${version}`),
  getLatestVersion: (paperId: string) => api.get(`/papers/${paperId}/versions/latest`),
};

// Review API
export const reviewApi = {
  getAssigned: () => api.get("/assignments/my"),
  getById: (reviewId: string) => api.get(`/reviews/${reviewId}`),
  getByAssignment: (assignmentId: string) => api.get(`/reviews/assignments/${assignmentId}`),
  saveDraft: (reviewId: string, data: ReviewFormData) =>
    api.post(`/reviews/${reviewId}/draft`, data),
  submit: (reviewId: string, data: ReviewFormData) =>
    api.post(`/reviews/${reviewId}/submit`, data),
  submitReview: (assignmentId: string, data: { score: number; confidence: number; comment?: string; recommendation?: string }) =>
    api.post(`/reviews/assignments/${assignmentId}/submit`, data),
  getPaperReviews: (paperId: string) => api.get(`/reviews/papers/${paperId}/reviews`),
};

// Review form data interface
export interface ReviewFormData {
  overallScore: number;
  confidence: number;
  summary?: string;
  strengths?: string;
  weaknesses?: string;
  commentsToAuthor?: string;
  commentsToChair?: string;
}

// Decision types
export type DecisionType = "accept" | "reject" | "conditional_accept";

// Decision API
export const decisionApi = {
  getInfo: (paperId: string) => api.get(`/decisions/papers/${paperId}/info`),
  getByPaper: (paperId: string) => api.get(`/decisions/papers/${paperId}`),
  makeDecision: (paperId: string, data: { finalDecision: DecisionType; comment?: string }) =>
    api.post(`/decisions/papers/${paperId}/make`, data),
  create: (paperId: string, data: { decision: string; comment?: string }) =>
    api.post(`/decisions/papers/${paperId}`, data),
  finalize: (paperId: string, finalDecision: string) =>
    api.put(`/decisions/papers/${paperId}/finalize`, { finalDecision }),
};

// Review Bidding API
export type BidValue = "YES" | "MAYBE" | "NO" | "CONFLICT";

export const biddingApi = {
  getMyBids: () => api.get("/review-bids/my"),
  getBidForPaper: (paperId: string) => api.get(`/review-bids/papers/${paperId}`),
  submitBid: (paperId: string, bid: BidValue) =>
    api.post(`/review-bids/papers/${paperId}`, { bid }),
  getConferenceBiddingMatrix: (conferenceId: string) =>
    api.get(`/review-bids/conferences/${conferenceId}`),
  getPapersForBidding: (conferenceId: string) =>
    api.get(`/review-bids/conferences/${conferenceId}/papers`),
  // Deprecated: Use submitBid instead. This uses wrong format.
  // setPaperBid sends { level } but backend expects { bid: BidValue }
  getPaperBids: (paperId: string) => api.get(`/review-bids/papers/${paperId}`),
};

// Review Assignment API
export const reviewAssignmentApi = {
  create: (data: { paperId: string; reviewerId: string; dueDate?: string }) =>
    api.post("/assignments/create", data),
  delete: (assignmentId: string) =>
    api.delete(`/assignments/${assignmentId}`),
  getForPaper: (paperId: string) =>
    api.get(`/assignments/papers/${paperId}`),
  getMyAssignments: () => api.get("/assignments/my"),
  updateStatus: (assignmentId: string, status: "NOT_STARTED" | "DRAFT" | "SUBMITTED") =>
    api.patch(`/assignments/${assignmentId}/status`, { status }),
  autoAssign: (conferenceId: string, targetReviewersPerPaper?: number) =>
    api.post(`/assignments/auto/${conferenceId}`, { targetReviewersPerPaper }),
  getConferenceStats: (conferenceId: string) =>
    api.get(`/assignments/conferences/${conferenceId}/stats`),
};

// Conflict API
export const conflictApi = {
  markConflict: (paperId: string) => api.post(`/conflicts/papers/${paperId}/mark`),
  unmarkConflict: (paperId: string) => api.post(`/conflicts/papers/${paperId}/unmark`),
  getPaperConflicts: (paperId: string) => api.get(`/conflicts/papers/${paperId}`),
};

// Camera Ready API
export const cameraReadyApi = {
  upload: (paperId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/camera-ready/papers/${paperId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getByPaper: (paperId: string) => api.get(`/camera-ready/papers/${paperId}`),
  approve: (paperId: string) => api.post(`/camera-ready-approval/papers/${paperId}/approve`),
  requestRevision: (paperId: string, comment: string) =>
    api.post(`/camera-ready-approval/papers/${paperId}/reject`, { comment }),
};

// Dashboard API
export const dashboardApi = {
  getMyDashboard: () => api.get("/dashboard/my"),
  getConferenceStats: (conferenceId: string) => api.get(`/dashboard/conferences/${conferenceId}`),
};

// Legacy Reviewer Assignment API - Use reviewAssignmentApi instead
// These endpoints are deprecated and use wrong paths
export const assignmentApi = {
  // Use reviewAssignmentApi.autoAssign(conferenceId) instead - requires conferenceId not paperId
  autoAssign: (conferenceId: string, targetReviewersPerPaper?: number) =>
    api.post(`/assignments/auto/${conferenceId}`, { targetReviewersPerPaper }),
  getByPaper: (paperId: string) => api.get(`/assignments/papers/${paperId}`),
};

// Invitation API
export const invitationApi = {
  sendInvitation: (conferenceId: string, data: { inviteeEmail: string; role: MemberRole; message?: string }) =>
    api.post("/invitations", { conferenceId, ...data }),
  getMyInvitations: (status?: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED") =>
    api.get("/invitations/my", { params: status ? { status } : {} }),
  acceptInvitation: (invitationId: string) =>
    api.post(`/invitations/${invitationId}/accept`),
  declineInvitation: (invitationId: string) =>
    api.post(`/invitations/${invitationId}/decline`),
  getConferenceInvitations: (conferenceId: string) =>
    api.get(`/conferences/${conferenceId}/invitations`),
  cancelInvitation: (invitationId: string) =>
    api.delete(`/invitations/${invitationId}`),
};

// Proceedings API
export interface AcceptedPaper {
  id: string;
  title: string;
  abstract: string | null;
  authors: string[];
  track: string | null;
  finalPdfUrl: string | null;
  keywords: string[];
  bibtex: string;
}

export interface ProceedingsData {
  conference: {
    id: string;
    name: string;
    shortName: string | null;
    year: number;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
  };
  generatedAt: string;
  acceptedPapers: AcceptedPaper[];
  fullBibtex: string;
  statistics: {
    totalAccepted: number;
    byTrack: { track: string; count: number }[];
  };
}

export const proceedingsApi = {
  get: (conferenceId: string) =>
    api.get<{ success: boolean; data: ProceedingsData }>(`/proceedings/conferences/${conferenceId}`),
  getPdf: (conferenceId: string) =>
    api.get(`/proceedings/conferences/${conferenceId}/pdf`, { responseType: "blob" }),
  getBibtex: (conferenceId: string) =>
    api.get(`/proceedings/conferences/${conferenceId}/bibtex`, { responseType: "blob" }),
};

// Metareview API
export type MetareviewRecommendation = "ACCEPT" | "REJECT" | "BORDERLINE";

export interface MetareviewFormData {
  summary: string;
  strengths: string;
  weaknesses: string;
  recommendation: MetareviewRecommendation;
  confidence: number; // 1-5
  reviewConsensus: boolean;
  disagreementNote?: string;
}

export interface MetareviewData extends MetareviewFormData {
  id: string;
  paperId: string;
  metaReviewerId: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  paper?: {
    id: string;
    title: string;
    abstract?: string;
    status: string;
    conferenceId: string;
    conference?: {
      id: string;
      name: string;
    };
  };
  metaReviewer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const metareviewApi = {
  create: (paperId: string, data: MetareviewFormData) =>
    api.post("/metareviews", { paperId, ...data }),
  update: (metareviewId: string, data: Partial<MetareviewFormData>) =>
    api.put(`/metareviews/${metareviewId}`, data),
  submit: (metareviewId: string) =>
    api.post(`/metareviews/${metareviewId}/submit`),
  getByPaper: (paperId: string) =>
    api.get<{ success: boolean; data: MetareviewData }>(`/metareviews/paper/${paperId}`),
  getByConference: (conferenceId: string) =>
    api.get<{ success: boolean; data: MetareviewData[] }>(`/metareviews/conference/${conferenceId}`),
  getMy: (conferenceId?: string) =>
    api.get<{ success: boolean; data: MetareviewData[] }>("/metareviews/my", {
      params: conferenceId ? { conferenceId } : {},
    }),
  delete: (metareviewId: string) =>
    api.delete(`/metareviews/${metareviewId}`),
};

// Discussion API
export interface DiscussionMessage {
  id: string;
  discussionId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface DiscussionData {
  id: string;
  paperId: string;
  status: "open" | "closed";
  closedAt?: string;
  closedById?: string;
  createdAt: string;
  updatedAt: string;
  paper?: {
    id: string;
    title: string;
    conferenceId: string;
  };
  messages: DiscussionMessage[];
}

export const discussionApi = {
  getByPaper: (paperId: string) =>
    api.get<{ success: boolean; data: DiscussionData }>(`/discussions/paper/${paperId}`),
  addMessage: (discussionId: string, message: string, isInternal = true) =>
    api.post(`/discussions/${discussionId}/messages`, { message, isInternal }),
  close: (discussionId: string) =>
    api.post(`/discussions/${discussionId}/close`),
  reopen: (discussionId: string) =>
    api.post(`/discussions/${discussionId}/reopen`),
  getByConference: (conferenceId: string) =>
    api.get<{ success: boolean; data: DiscussionData[] }>(`/discussions/conference/${conferenceId}`),
  deleteMessage: (messageId: string) =>
    api.delete(`/discussions/messages/${messageId}`),
};

export default api;
