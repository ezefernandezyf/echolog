import { Button } from './button';
import { cn } from '../../lib/cn';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorAlert({ message, onRetry, retryLabel = 'Retry', className }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-red-200 bg-red-50/30 px-6 py-10 text-center dark:border-red-800/30 dark:bg-red-950/10',
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="size-5 text-red-600 dark:text-red-400"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
