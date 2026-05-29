interface AuthCardProps {
  children: React.ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center bg-secondary p-4"
    >
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            EchoLog
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-lg px-6 py-8 sm:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}
