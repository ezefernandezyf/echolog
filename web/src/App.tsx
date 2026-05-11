import { useSession } from './auth/use-session';
import { AppRouter } from './core/router';
import { SessionSkeleton } from './shared/components/domain-skeletons';

export function App() {
  const sessionQuery = useSession();

  if (sessionQuery.isPending) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <SessionSkeleton />
      </main>
    );
  }

  return <AppRouter />;
}
