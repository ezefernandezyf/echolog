import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginForm } from '../auth/components/login-form';
import { RegisterForm } from '../auth/components/register-form';
import { ProtectedRoute, PublicRoute } from '../auth/auth-guard';
import { BoardLayout } from '../boards/components/board-layout';
import { WorkspaceHub } from '../workspaces/components/workspace-hub';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<WorkspaceHub />} />
        <Route path="/w/:workspaceId" element={<BoardLayout />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
