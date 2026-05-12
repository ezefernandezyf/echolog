import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginForm } from '../auth/components/login-form';
import { RegisterForm } from '../auth/components/register-form';
import { ProtectedRoute, PublicRoute } from '../auth/auth-guard';
import { BoardLayout } from '../boards/components/board-layout';
import { PostDetailPage } from '../boards/components/post-detail-page';
import { WorkspaceHub } from '../workspaces/components/workspace-hub';
import { WorkspaceSettingsPage } from '../workspaces/components/workspace-settings-page';
import { LandingPage } from '../shared/components/landing-page';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/w" element={<WorkspaceHub />} />
        <Route path="/w/:workspaceId" element={<BoardLayout />} />
        <Route path="/w/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
        <Route path="/w/:workspaceId/p/:postId" element={<PostDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
