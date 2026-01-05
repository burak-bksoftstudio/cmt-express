// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRoles extends User {
  roles: ConferenceRole[];
}

export interface ConferenceRole {
  id: string;
  userId: string;
  conferenceId: string;
  role: "chair" | "reviewer" | "author" | "meta_reviewer";
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DecodedToken {
  userId: string;
  iat: number;
  exp: number;
}

// Conference types
export interface Conference {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  settings?: ConferenceSettings;
}

export interface ConferenceSettings {
  id: string;
  conferenceId: string;
  submissionDeadline?: string;
  reviewDeadline?: string;
  assignmentTimeoutDays: number;
  maxReviewersPerPaper: number;
}

// Track types
export interface Track {
  id: string;
  name: string;
  description?: string;
  conferenceId: string;
  createdAt: string;
  _count?: {
    papers: number;
  };
}

// Conference Member types
export type MemberRole = "CHAIR" | "REVIEWER" | "AUTHOR" | "META_REVIEWER";

export interface ConferenceMember {
  id: string;
  conferenceId: string;
  userId: string;
  role: MemberRole;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
  };
}

// Paper types
export interface Paper {
  id: string;
  conferenceId: string;
  trackId?: string;
  title: string;
  abstract?: string;
  status: "submitted" | "under_review" | "accepted" | "rejected" | "revision";
  createdAt: string;
  updatedAt: string;
  conference?: Conference;
  track?: Track;
  authors?: PaperAuthor[];
  files?: PaperFile[];
  keywords?: PaperKeyword[];
  reviews?: Review[];
  decision?: Decision;
}

export interface PaperAuthor {
  id: string;
  paperId: string;
  userId: string;
  order: number;
  user?: User;
}

export interface PaperFile {
  id: string;
  paperId: string;
  fileName: string;
  mimeType: string;
  fileKey: string;
  fileUrl: string;
  createdAt: string;
}

export interface PaperKeyword {
  id: string;
  paperId: string;
  keywordId: string;
  keyword?: Keyword;
}

export interface Keyword {
  id: string;
  name: string;
}

// Review types
export interface Review {
  id: string;
  paperId: string;
  assignmentId: string;
  score?: number;
  confidence?: number;
  comment?: string;
  recommendation?: string;
  summary?: string;
  strengths?: string;
  weaknesses?: string;
  commentsToAuthor?: string;
  commentsToChair?: string;
  submittedAt?: string;
  paper?: Paper;
  assignment?: ReviewerAssignment;
}

export interface ReviewerAssignment {
  id: string;
  paperId: string;
  reviewerId: string;
  status: "pending" | "accepted" | "declined" | "completed";
  assignedAt: string;
  expiresAt: string;
  respondedAt?: string;
  paper?: Paper;
  reviewer?: User;
  review?: Review;
}

// Decision types
export interface Decision {
  id: string;
  paperId: string;
  decision: string;
  finalDecision?: string;
  comment?: string;
  averageScore?: number;
  averageConfidence?: number;
  reviewCount?: number;
  decidedAt: string;
}

// Bidding types
export interface PaperBid {
  id: string;
  paperId: string;
  userId: string;
  level: "high" | "medium" | "low" | "no_bid";
  createdAt: string;
  paper?: Paper;
  user?: User;
}

// Conflict types
export interface ReviewerConflict {
  id: string;
  paperId: string;
  userId: string;
  createdAt: string;
  paper?: Paper;
  user?: User;
}

// Camera Ready types
export interface CameraReadyFile {
  id: string;
  paperId: string;
  fileName: string;
  mimeType: string;
  fileKey: string;
  fileUrl: string;
  status: "submitted" | "needs_revision" | "approved";
  reviewerComment?: string;
  decidedAt?: string;
  uploadedAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalPapers: number;
  acceptedPapers: number;
  rejectedPapers: number;
  pendingPapers: number;
  totalReviewers: number;
  completedReviews: number;
  pendingReviews: number;
  averageScore: number;
  averageConfidence: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Role helpers
export type UserRole = "admin" | "chair" | "reviewer" | "author" | "meta_reviewer";

export interface UserPermissions {
  isAdmin: boolean;
  isChair: boolean;
  isReviewer: boolean;
  isAuthor: boolean;
  isMetaReviewer?: boolean;
  conferenceRoles: Map<string, ConferenceRole["role"][]>;
}

export interface UserStats {
  hasRequests: boolean;
  hasPapers: boolean;
  hasInvitations: boolean;
  hasReviewAssignments: boolean;
  hasConferences: boolean;
  // Notification counts
  pendingInvitations?: number;
  pendingReviews?: number;
  newDecisions?: number;
  totalNotifications?: number;
}
