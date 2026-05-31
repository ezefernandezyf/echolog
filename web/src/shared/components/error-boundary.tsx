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
        <main className="flex min-h-screen items-center justify-center bg-secondary p-6">
          <div className="max-w-md space-y-4 rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-lg">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <span className="text-2xl">⚠</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                {this.state.error.message || 'An unexpected error occurred'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
