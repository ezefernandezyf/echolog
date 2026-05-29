import { useNavigate } from 'react-router-dom';
import { Card } from '../../shared/components/ui/card';
import { cn } from '../../shared/lib/cn';
import type { WorkspaceRole } from '../../../../shared/contracts/index.js';

export interface WorkspaceCardData {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  activeBoardsCount?: number;
}

interface WorkspaceCardProps {
  workspace: WorkspaceCardData;
  onSelect?: (workspace: WorkspaceCardData) => void;
}

function roleLabel(role: WorkspaceRole): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function captionText(workspace: WorkspaceCardData): string {
  if (workspace.activeBoardsCount !== undefined) {
    return `${workspace.activeBoardsCount} active board${workspace.activeBoardsCount === 1 ? '' : 's'}`;
  }
  return roleLabel(workspace.role);
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
        'group flex h-full cursor-pointer flex-col gap-4 p-5 transition-all duration-150 hover:border-primary/30 hover:shadow-sm hover:shadow-black/[0.04]',
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
      aria-label={`${workspace.name}, ${captionText(workspace)}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-semibold tracking-tight text-muted-foreground ring-1 ring-inset ring-border">
          {initials || 'WS'}
        </div>

        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-semibold tracking-tight text-foreground">
            {workspace.name}
          </h3>
          <p className="text-sm text-muted-foreground">{captionText(workspace)}</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground transition-colors group-hover:text-secondary-foreground">
        <span className="truncate">/{workspace.slug}</span>
        <span className="rounded-full bg-muted px-2 py-1 font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </span>
      </div>
    </Card>
  );
}
