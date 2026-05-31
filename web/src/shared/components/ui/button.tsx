import type { ButtonHTMLAttributes, Ref } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-sm shadow-black/5 hover:bg-primary/90 active:bg-primary/80',
  outline: 'border border-border bg-card text-foreground hover:bg-secondary active:bg-muted',
  ghost: 'bg-transparent text-foreground hover:bg-muted active:bg-secondary',
};

export function Button({
  ref,
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium tracking-[-0.01em] transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
