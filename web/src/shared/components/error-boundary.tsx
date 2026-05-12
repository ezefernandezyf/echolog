import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-background">
          <div className="max-w-md space-y-4 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-900 dark:bg-card">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <span className="text-2xl">⚠</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Something went wrong
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {this.state.error.message || 'An unexpected error occurred'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Reload page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
