import { Skeleton } from './ui/skeleton';
import { cn } from '../lib/cn';

/**
 * Mimics a post row layout: vote button shape + title/description lines + comment count
 */
export function PostSkeleton() {
  return (
    <article
      className="border-b border-border bg-card"
      aria-hidden="true"
    >
      <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-5 py-5 sm:px-6">
        {/* Vote button shape */}
        <Skeleton width={48} height={56} rounded="2xl" />

        {/* Title + description */}
        <div className="min-w-0 space-y-3 pt-1">
          <Skeleton width="60%" height={18} rounded="md" />
          <Skeleton width="85%" height={14} rounded="md" />
          <Skeleton width="40%" height={14} rounded="md" />
        </div>

        {/* Right column: comment count + avatar */}
        <div className="flex flex-col items-end gap-3 pt-1">
          <Skeleton width={110} height={28} rounded="full" />
          <Skeleton width={32} height={32} rounded="full" />
        </div>
      </div>
    </article>
  );
}

/**
 * Mimics a single board item in the sidebar list
 */
export function BoardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3" aria-hidden="true">
      <Skeleton width={8} height={8} rounded="full" className="shrink-0" />
      <Skeleton width="60%" height={16} rounded="md" />
    </div>
  );
}

interface BoardSkeletonListProps {
  count?: number;
  className?: string;
}

export function BoardSkeletonList({ count = 4, className }: BoardSkeletonListProps) {
  return (
    <div className={cn('space-y-1 px-3 py-4', className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <BoardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Mimics a workspace card: icon circle + name line + subtitle line + footer
 */
export function WorkspaceSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5" aria-hidden="true">
      <div className="flex items-start gap-4">
        <Skeleton width={48} height={48} rounded="2xl" className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <Skeleton width="70%" height={18} rounded="md" />
          <Skeleton width="45%" height={14} rounded="md" />
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <Skeleton width={80} height={12} rounded="md" />
        <Skeleton width={72} height={20} rounded="full" />
      </div>
    </div>
  );
}

interface WorkspaceSkeletonGridProps {
  count?: number;
  className?: string;
}

export function WorkspaceSkeletonGrid({ count = 3, className }: WorkspaceSkeletonGridProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <WorkspaceSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Mimics a post list header area (used for bootstrapping view)
 */
export function SessionSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-6 px-6 py-16"
      aria-hidden="true"
    >
      <Skeleton width={48} height={48} rounded="2xl" />
      <div className="space-y-2 text-center">
        <Skeleton width={200} height={20} rounded="md" className="mx-auto" />
        <Skeleton width={160} height={14} rounded="md" className="mx-auto" />
      </div>
    </div>
  );
}
