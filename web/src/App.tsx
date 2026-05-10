import { useSession } from './auth/use-session';
import { AppRouter } from './core/router';

export function App() {
  const sessionQuery = useSession();

  if (sessionQuery.isPending) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
          <p className="text-sm text-zinc-500">Bootstrapping session...</p>
        </section>
      </main>
    );
  }

  return (
    <AppRouter />
  );
}
