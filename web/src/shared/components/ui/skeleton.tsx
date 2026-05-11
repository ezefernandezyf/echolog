import type { HTMLAttributes, Ref } from 'react';
import { cn } from '../../lib/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

const defaultWidth = '100%';
const defaultHeight = '1rem';
const defaultRounded = 'md';

export function Skeleton({
  ref,
  className,
  width = defaultWidth,
  height = defaultHeight,
  rounded = defaultRounded,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-zinc-200',
        rounded === 'sm' && 'rounded-sm',
        rounded === 'md' && 'rounded-md',
        rounded === 'lg' && 'rounded-lg',
        rounded === 'xl' && 'rounded-xl',
        rounded === '2xl' && 'rounded-2xl',
        rounded === 'full' && 'rounded-full',
        className,
      )}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}
