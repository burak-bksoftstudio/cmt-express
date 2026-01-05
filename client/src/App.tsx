import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import {
  LoginPage,
  RegisterPage,
  LandingPage,
  DashboardPage,
  SettingsPage,
  BiddingPage,
  CameraReadyPage,
  InvitationsPage,
  PapersPage,
  PaperDetailPage,
  NewPaperPage,
  SubmitPaperPage,
  ConferencesPage,
  ConferenceDetailPage,
  CreateConferencePage,
  CreateConferenceRequestPage,
  ConferenceSettingsPage,
  ConferenceMembersPage,
  ConferenceAssignmentsPage,
  ConferenceBiddingPage,
  ConferenceProceedingsPage,
  ConferenceCameraReadyPage,
  ReviewsPage,
  ReviewDetailPage,
  MetareviewPage,
  MetareviewsListPage,
  ConferenceRequestsPage,
  MyConferenceRequestsPage,
  AdminDashboardPage,
  AllPapersPage,
  AllConferencesPage,
  AllReviewsPage,
  AdminSettingsPage,
  UsersManagementPage,
} from "./pages";

function App() {
  return (
    <>
      <Routes>
        {/* Auth routes - Clerk handles these */}
        <Route path="/sign-in/*" element={<LoginPage />} />
        <Route path="/sign-up/*" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        {/* Legacy redirects */}
        <Route path="/login" element={<Navigate to="/sign-in" replace />} />
        <Route path="/register" element={<Navigate to="/sign-up" replace />} />

        {/* Main routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Papers */}
        <Route path="/papers" element={<PapersPage />} />
        <Route path="/papers/new" element={<NewPaperPage />} />
        <Route path="/papers/submit" element={<SubmitPaperPage />} />
        <Route path="/papers/:paperId" element={<PaperDetailPage />} />

        {/* Conferences */}
        <Route path="/conferences" element={<ConferencesPage />} />
        <Route path="/conferences/create" element={<CreateConferencePage />} />
        <Route path="/conference-requests/create" element={<CreateConferenceRequestPage />} />
        <Route path="/conference-requests/my" element={<MyConferenceRequestsPage />} />
        <Route path="/conferences/:id" element={<ConferenceDetailPage />} />
        <Route path="/conferences/:id/settings" element={<ConferenceSettingsPage />} />
        <Route path="/conferences/:id/members" element={<ConferenceMembersPage />} />
        <Route path="/conferences/:id/assignments" element={<ConferenceAssignmentsPage />} />
        <Route path="/conferences/:id/bidding" element={<ConferenceBiddingPage />} />
        <Route path="/conferences/:id/proceedings" element={<ConferenceProceedingsPage />} />
        <Route path="/conferences/:id/camera-ready" element={<ConferenceCameraReadyPage />} />
        <Route path="/conferences/:id/reviews" element={<ReviewsPage />} />

        {/* Reviews (global - shows all) */}
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reviews/:id" element={<ReviewDetailPage />} />

        {/* Metareviews */}
        <Route path="/metareviews" element={<MetareviewsListPage />} />
        <Route path="/papers/:paperId/metareview" element={<MetareviewPage />} />

        {/* Legacy routes - redirect to conference selection */}
        <Route path="/bidding" element={<Navigate to="/conferences" replace />} />
        <Route path="/camera-ready" element={<CameraReadyPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/conferences" element={<AllConferencesPage />} />
        <Route path="/admin/conference-requests" element={<ConferenceRequestsPage />} />
        <Route path="/admin/papers" element={<AllPapersPage />} />
        <Route path="/admin/reviews" element={<AllReviewsPage />} />
        <Route path="/admin/users" element={<UsersManagementPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
