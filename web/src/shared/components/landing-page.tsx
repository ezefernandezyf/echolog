import { useNavigate, Link } from 'react-router-dom';
import { EnvelopeSimple, CaretUp, Circle, SquaresFour, ArrowRight } from '@phosphor-icons/react';
import { Button } from './ui/button';
import { PageTitle } from '../../core/page-title';

const features = [
  {
    title: 'Collect Feedback',
    description:
      'Gather ideas, bug reports, and feature requests from your users in one organized place.',
    icon: <EnvelopeSimple size={20} className="text-primary" />,
  },
  {
    title: 'Prioritize with Votes',
    description:
      'Let your community vote on what matters most. Build what your users actually want.',
    icon: <CaretUp size={20} className="text-primary" />,
  },
  {
    title: 'Keep Users in the Loop',
    description:
      'Update post statuses from Open → Planned → In Progress → Done. Your users see every step.',
    icon: <Circle size={20} className="text-primary" />,
  },
  {
    title: 'Workspace Isolation',
    description:
      'Separate feedback per product or team. Each workspace has its own boards, posts, and members.',
    icon: <SquaresFour size={20} className="text-primary" />,
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <main id="main-content" className="flex min-h-screen flex-col bg-background text-foreground">
      <PageTitle title="Feedback Platform" />
      {/* Hero */}
      <header className="relative flex flex-col items-center px-4 py-24 sm:py-32 lg:py-40">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="font-display text-6xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-7xl lg:text-8xl">
            <span className="text-accent">EchoLog</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Give every team their own space. Collect feedback, vote on ideas, ship what matters -
            without the noise.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="accent"
              className="h-12 px-8 text-base font-semibold shadow-sm hover:-translate-y-0.5 active:scale-95"
              onClick={() => navigate('/register')}
            >
              Get Started Free
              <ArrowRight size={16} className="inline-block" aria-hidden="true" />
            </Button>
            <Link
              to="/explore"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 text-base font-medium tracking-[-0.01em] text-foreground transition-all duration-150 hover:bg-secondary active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            No credit card required · Free forever plan
          </p>
        </div>
      </header>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20 sm:pb-32">
        <h2 className="sr-only">Features</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="stagger-item rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent text-lg"
                aria-hidden="true"
              >
                {feature.icon}
              </span>
              <h3 className="mt-4 font-display text-base font-semibold tracking-[-0.02em] text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} EchoLog. All rights reserved.
      </footer>
    </main>
  );
}
