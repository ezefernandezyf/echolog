import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

const features = [
  {
    title: 'Collect Feedback',
    description:
      'Gather ideas, bug reports, and feature requests from your users in one organized place.',
    icon: '✉',
  },
  {
    title: 'Prioritize with Votes',
    description:
      'Let your community vote on what matters most. Build what your users actually want.',
    icon: '▲',
  },
  {
    title: 'Keep Users in the Loop',
    description:
      'Update post statuses from Open → Planned → In Progress → Done. Your users see every step.',
    icon: '◎',
  },
  {
    title: 'Workspace Isolation',
    description:
      'Separate feedback per product or team. Each workspace has its own boards, posts, and members.',
    icon: '⊞',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <main id="main-content" className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Hero */}
      <header className="flex flex-col items-center px-4 pb-16 pt-20 sm:pb-24 sm:pt-32">
        <h1 className="text-5xl font-bold tracking-[-0.04em] text-foreground sm:text-6xl">
          EchoLog
        </h1>
        <p className="mt-4 max-w-lg text-center text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Collect, prioritize, and act on customer feedback
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            className="h-11 px-6 text-sm"
            onClick={() => navigate('/register')}
          >
            Get Started
          </Button>
          <Button
            variant="outline"
            className="h-11 px-6 text-sm"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20 sm:pb-32">
        <h2 className="sr-only">Features</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
            >
              <span className="text-2xl" aria-hidden="true">
                {feature.icon}
              </span>
              <h2 className="mt-3 text-base font-semibold tracking-[-0.02em] text-foreground">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Built with ♥ — EchoLog
      </footer>
    </main>
  );
}
