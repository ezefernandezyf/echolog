import type { HTMLAttributes, Ref } from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'default' | 'secondary' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  ref?: Ref<HTMLSpanElement>;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  outline: 'border border-border bg-transparent text-zinc-700 dark:text-zinc-400',
};

export function Badge({ ref, className, variant = 'secondary', ...props }: BadgeProps) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none tracking-[0.08em] font-mono',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
