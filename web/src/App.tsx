import { useEffect } from 'react';
import { useSession } from './auth/use-session';
import { AppRouter } from './core/router';
import { useUiStore } from './core/store/ui-store';
import { SessionSkeleton } from './shared/components/domain-skeletons';

export function App() {
  const sessionQuery = useSession();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  // Sync theme class on document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Listen to system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference in localStorage
      try {
        const stored = localStorage.getItem('echolog-theme');
        if (stored) return;
      } catch {
        // fall through
      }
      setTheme(e.matches ? 'dark' : 'light');
    };

    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [setTheme]);

  if (sessionQuery.isPending) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <SessionSkeleton />
      </main>
    );
  }

  return (
    <>
      <AppRouter />
    </>
  );
}
