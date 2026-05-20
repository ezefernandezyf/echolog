import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginForm } from '../auth/components/login-form';
import { RegisterForm } from '../auth/components/register-form';
import { ProtectedRoute, PublicRoute } from '../auth/auth-guard';
import { AuthenticatedLayout } from '../auth/authenticated-layout';
import { BoardLayout } from '../boards/components/board-layout';
import { BoardSettingsPage } from '../boards/components/board-settings-page';
import { PostDetailPage } from '../boards/components/post-detail-page';
import { WorkspaceHub } from '../workspaces/components/workspace-hub';
import { WorkspaceSettingsPage } from '../workspaces/components/workspace-settings-page';
import { MembersPage } from '../workspaces/components/members-page';
import { AcceptInvitationPage } from '../workspaces/components/accept-invitation-page';
import { UserSettingsPage } from '../user/settings-page';
import { LandingPage } from '../shared/components/landing-page';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
      </Route>

      {/* Public invitation route — no auth required, but checks inside */}
      <Route path="/invite/:token" element={<AcceptInvitationPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/w" element={<WorkspaceHub />} />
          <Route path="/w/:workspaceId" element={<BoardLayout />} />
          <Route path="/w/:workspaceId/members" element={<MembersPage />} />
          <Route path="/w/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
          <Route path="/w/:workspaceId/b/:boardId/settings" element={<BoardSettingsPage />} />
          <Route path="/w/:workspaceId/p/:postId" element={<PostDetailPage />} />
          <Route path="/settings" element={<UserSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
