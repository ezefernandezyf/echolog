import { useNavigate } from 'react-router-dom';
import { Card } from '../../shared/components/ui/card';
import { cn } from '../../shared/lib/cn';

export interface WorkspaceCardData {
  id: string;
  name: string;
  slug: string;
  activeBoardsCount: number;
}

interface WorkspaceCardProps {
  workspace: WorkspaceCardData;
  onSelect?: (workspace: WorkspaceCardData) => void;
}

function formatBoardsCount(count: number) {
  return `${count} active board${count === 1 ? '' : 's'}`;
}

export function WorkspaceCard({ workspace, onSelect }: WorkspaceCardProps) {
  const navigate = useNavigate();
  const initials = workspace.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <Card
      className={cn(
        'group flex h-full cursor-pointer flex-col gap-4 p-5 transition-all duration-150 hover:border-zinc-300 hover:shadow-sm hover:shadow-zinc-900/[0.04]',
      )}
      role="button"
      tabIndex={0}
      onClick={() => {
        onSelect?.(workspace);
        navigate(`/w/${workspace.id}`);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.(workspace);
          navigate(`/w/${workspace.id}`);
        }
      }}
      aria-label={`${workspace.name}, ${formatBoardsCount(workspace.activeBoardsCount)}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-sm font-semibold tracking-tight text-zinc-400 ring-1 ring-inset ring-zinc-200">
          {initials || 'WS'}
        </div>

        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-semibold tracking-tight text-zinc-900">{workspace.name}</h3>
          <p className="text-sm text-zinc-500">{formatBoardsCount(workspace.activeBoardsCount)}</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-400 transition-colors group-hover:text-zinc-600">
        <span className="truncate">/{workspace.slug}</span>
        <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium uppercase tracking-[0.18em] text-zinc-500">
          Workspace
        </span>
      </div>
    </Card>
  );
}
