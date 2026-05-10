import { useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from './auth/auth-guard';
import { LoginForm } from './auth/components/login-form';
import { RegisterForm } from './auth/components/register-form';
import { useAuthStore } from './auth/auth-store';
import { useSession, AUTH_QUERY_KEYS } from './auth/use-session';
import { authApi } from './core/api-client';

export function App() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const sessionQuery = useSession();

  const handleLogout = async () => {
    await authApi.logout();
    clearSession();
    queryClient.setQueryData(AUTH_QUERY_KEYS.session, null);
  };

  if (sessionQuery.isPending) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
          <p>Bootstrapping session...</p>
        </section>
      </main>
    );
  }

  if (session) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <section className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-16">
          <header>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">EchoLog</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">You are signed in.</h1>
          </header>
          <AuthGuard fallback={<p>Session missing.</p>}>
            <div>
              <p>{session.user.email}</p>
              <button type="button" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </AuthGuard>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-16">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">EchoLog</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Feedback infrastructure, ready to grow.</h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Session bootstrap is wired through React Query and Zustand.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <LoginForm />
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
