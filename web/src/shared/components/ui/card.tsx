import type { HTMLAttributes, Ref } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function Card({ ref, className, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground shadow-sm shadow-black/[0.03]',
        className,
      )}
      {...props}
    />
  );
}
