'use client';

import { Link } from 'react-router-dom';
import { ThemeToggle } from '../shared/components/theme-toggle';

interface MobileHeaderProps {
  onToggleSidebar: () => void;
}

export function MobileHeader({ onToggleSidebar }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 pt-[env(safe-area-inset-top)] lg:hidden">
      <button
        type="button"
        id="mobile-hamburger"
        onClick={onToggleSidebar}
        aria-label="Open sidebar"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary shadow-sm transition-colors hover:bg-muted"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-5 text-secondary-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>
      <Link to="/w" className="font-semibold tracking-tight text-foreground">
        EchoLog
      </Link>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
