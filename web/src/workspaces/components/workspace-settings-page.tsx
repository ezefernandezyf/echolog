'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { ConfirmDialog } from '../../shared/components/ui/confirm-dialog';
import { CharCounter } from '../../shared/components/ui/char-counter';
import { mapServerErrors } from '../../shared/lib/map-server-errors';
import { slugify } from '../../../../shared/lib/slugify';
import { useAuthStore } from '../../auth/auth-store';
import { useWorkspaces } from '../../hooks/use-workspaces';
import { useUpdateWorkspace, useDeleteWorkspace } from '../../hooks/use-workspaces';
import { useUpdateVisibility } from '../../hooks/use-public-workspaces';
import type { UpdateWorkspaceDTO, Visibility, PublicAccessLevel, WorkspacePermissionLevel, BoardCreationPolicy } from '../../../../shared/contracts/index.js';
import { updateWorkspaceSchema } from '../../../../shared/contracts/index.js';
import { PageTitle } from '../../core/page-title';

export function WorkspaceSettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState<Visibility | null>(null);
  const [pendingAccessLevel, setPendingAccessLevel] = useState<PublicAccessLevel | null>(null);

  const userId = useAuthStore((state) => state.session?.user?.id);

  // Get workspace from the query cache
  const workspaceQuery = useWorkspaces(userId);

  const workspace = Array.isArray(workspaceQuery.data)
    ? workspaceQuery.data.find((w) => w.id === workspaceId)
    : null;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<
    z.input<typeof updateWorkspaceSchema>,
    undefined,
    z.output<typeof updateWorkspaceSchema>
  >({
    resolver: zodResolver(updateWorkspaceSchema),
    values: workspace ? { name: workspace.name, slug: workspace.slug } : undefined,
  });

  const name = watch('name', '') as string;

  const updateWorkspaceMutation = useUpdateWorkspace();

  const deleteWorkspaceMutation = useDeleteWorkspace();

  const updateVisibilityMutation = useUpdateVisibility();

  const isOwner = workspace?.role === 'OWNER';
  const [visibility, setVisibility] = useState<Visibility>(workspace?.visibility ?? 'PRIVATE');
  const [publicAccessLevel, setPublicAccessLevel] = useState<PublicAccessLevel>(workspace?.publicAccessLevel ?? 'READ_ONLY');

  if (workspaceQuery.isPending) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="space-y-4">
            <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (!workspace) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">Workspace not found</p>
          <Link to="/w" className="mt-4 inline-block text-sm font-medium text-foreground underline">
            Back to workspaces
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
      <PageTitle title="Workspace Settings" />
      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link to="/w" className="text-muted-foreground transition-colors hover:text-foreground">
            Workspaces
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <Link
            to={`/w/${workspaceId}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {workspace.name}
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground" aria-current="page">
            Settings
          </span>
        </nav>

        {/* General Settings */}
        <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">General</h2>
            <p className="text-sm text-muted-foreground">
              Update your workspace name and URL slug.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit((data) => {
              // Only send changed fields
              const changed: UpdateWorkspaceDTO = {};
              if (data.name !== workspace.name) changed.name = data.name;
              if (data.slug !== workspace.slug) changed.slug = data.slug;
              if (Object.keys(changed).length === 0) return;
              updateWorkspaceMutation.mutate(
                { workspaceId: workspaceId!, data: changed },
                {
                  onSuccess: (data) => {
                    reset({ name: data.name, slug: data.slug });
                  },
                  onError: (error) => {
                    const fallback = mapServerErrors(error, setError);
                    if (fallback) {
                      toast.error(fallback);
                    }
                  },
                },
              );
            })}
          >
            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">Workspace Name</span>
              <Input
                id="workspace-settings-name"
                placeholder="Northstar Labs"
                autoComplete="off"
                maxLength={120}
                aria-describedby={errors.name ? 'workspace-settings-name-error' : undefined}
                aria-invalid={errors.name ? true : undefined}
                {...register('name')}
              />
              {name.trim() ? (
                <p className="text-xs text-muted-foreground">Slug: {slugify(name)}</p>
              ) : null}
              <CharCounter current={name.length} max={120} />
              {errors.name ? (
                <p
                  id="workspace-settings-name-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.name.message}
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground">Slug</span>
              <Input
                id="workspace-settings-slug"
                placeholder="northstar-labs"
                autoComplete="off"
                maxLength={120}
                aria-describedby={errors.slug ? 'workspace-settings-slug-error' : undefined}
                aria-invalid={errors.slug ? true : undefined}
                {...register('slug')}
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs: echolog.app/w/{workspace.slug}
              </p>
              {errors.slug ? (
                <p
                  id="workspace-settings-slug-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.slug.message}
                </p>
              ) : null}
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={updateWorkspaceMutation.isPending || !isDirty}
                className="bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
              >
                {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </section>

        {/* Admin Settings */}
        {isOwner ? (
          <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Admin Settings</h2>
              <p className="text-sm text-muted-foreground">
                Control what workspace admins are allowed to do.
              </p>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={workspace.adminsCanEditSettings ?? true}
                onChange={(e) => {
                  updateWorkspaceMutation.mutate(
                    {
                      workspaceId: workspaceId!,
                      data: { adminsCanEditSettings: e.target.checked },
                    },
                    {
                      onError: (error) => {
                        toast.error(error instanceof Error ? error.message : 'Failed to update setting');
                      },
                    },
                  );
                }}
                disabled={updateWorkspaceMutation.isPending}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Admins can edit settings</span>
            </label>
            <p className="text-xs text-muted-foreground">
              When disabled, only the workspace owner can modify workspace settings.
            </p>
          </section>
        ) : null}

        {/* Permissions */}
        {isOwner ? (
          <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Permissions</h2>
              <p className="text-sm text-muted-foreground">
                Control who can perform specific actions in this workspace.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground" id="perm-board-creation-label">
                Board Creation
              </span>
              <select
                id="perm-board-creation"
                aria-labelledby="perm-board-creation-label"
                value={workspace.boardCreation ?? 'MEMBERS'}
                onChange={(e) => {
                  updateWorkspaceMutation.mutate(
                    {
                      workspaceId: workspaceId!,
                      data: { boardCreation: e.target.value as WorkspacePermissionLevel },
                    },
                    {
                      onError: (error) => {
                        toast.error(error instanceof Error ? error.message : 'Failed to update permission');
                      },
                    },
                  );
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={updateWorkspaceMutation.isPending}
              >
                <option value="OWNER">Owner only</option>
                <option value="ADMINS">Owner & Admins</option>
                <option value="MEMBERS">All members</option>
                <option value="NOBODY">Nobody</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground" id="perm-board-deletion-label">
                Board Deletion
              </span>
              <select
                id="perm-board-deletion"
                aria-labelledby="perm-board-deletion-label"
                value={workspace.boardDeletion ?? 'ADMINS'}
                onChange={(e) => {
                  updateWorkspaceMutation.mutate(
                    {
                      workspaceId: workspaceId!,
                      data: { boardDeletion: e.target.value as WorkspacePermissionLevel },
                    },
                    {
                      onError: (error) => {
                        toast.error(error instanceof Error ? error.message : 'Failed to update permission');
                      },
                    },
                  );
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={updateWorkspaceMutation.isPending}
              >
                <option value="OWNER">Owner only</option>
                <option value="ADMINS">Owner & Admins</option>
                <option value="MEMBERS">All members</option>
                <option value="NOBODY">Nobody</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground" id="perm-commenting-label">
                Commenting
              </span>
              <select
                id="perm-commenting"
                aria-labelledby="perm-commenting-label"
                value={workspace.commenting ?? 'MEMBERS'}
                onChange={(e) => {
                  updateWorkspaceMutation.mutate(
                    {
                      workspaceId: workspaceId!,
                      data: { commenting: e.target.value as WorkspacePermissionLevel },
                    },
                    {
                      onError: (error) => {
                        toast.error(error instanceof Error ? error.message : 'Failed to update permission');
                      },
                    },
                  );
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={updateWorkspaceMutation.isPending}
              >
                <option value="OWNER">Owner only</option>
                <option value="ADMINS">Owner & Admins</option>
                <option value="MEMBERS">All members</option>
                <option value="NOBODY">Nobody</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-secondary-foreground" id="perm-board-creation-policy-label">
                Board Creation Policy
              </span>
              <select
                id="perm-board-creation-policy"
                aria-labelledby="perm-board-creation-policy-label"
                value={workspace.boardCreationPolicy ?? 'FREE'}
                onChange={(e) => {
                  updateWorkspaceMutation.mutate(
                    {
                      workspaceId: workspaceId!,
                      data: { boardCreationPolicy: e.target.value as BoardCreationPolicy },
                    },
                    {
                      onError: (error) => {
                        toast.error(error instanceof Error ? error.message : 'Failed to update policy');
                      },
                    },
                  );
                }}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={updateWorkspaceMutation.isPending}
              >
                <option value="FREE">Free — anyone with board creation permission can create</option>
                <option value="APPROVAL_REQUIRED">Approval Required — members request, admins approve</option>
                <option value="ADMINS_ONLY">Admins Only — only admins/owner can create</option>
              </select>
            </label>
          </section>
        ) : null}

        {/* Visibility */}
        {isOwner ? (
          <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Visibility</h2>
              <p className="text-sm text-muted-foreground">
                Control who can see and interact with this workspace.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-secondary-foreground">Status</span>
                <select
                  id="workspace-visibility"
                  value={visibility}
                  onChange={(e) => {
                    const newVisibility = e.target.value as Visibility;
                    setPendingVisibility(newVisibility);
                    setPendingAccessLevel(newVisibility === 'PUBLIC' ? publicAccessLevel : null);
                    setShowVisibilityDialog(true);
                  }}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={updateVisibilityMutation.isPending}
                >
                  <option value="PRIVATE">Private - only members can access</option>
                  <option value="PUBLIC">Public - discoverable by anyone</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {visibility === 'PUBLIC'
                    ? 'Anyone can find and view this workspace. Write access depends on the level below.'
                    : 'Only invited members can access this workspace.'}
                </p>
              </label>

              {visibility === 'PUBLIC' ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-secondary-foreground">Access Level</span>
                  <select
                    id="workspace-access-level"
                    value={publicAccessLevel}
                    onChange={(e) => {
                      const newLevel = e.target.value as PublicAccessLevel;
                      setPendingVisibility('PUBLIC');
                      setPendingAccessLevel(newLevel);
                      setShowVisibilityDialog(true);
                    }}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    disabled={updateVisibilityMutation.isPending}
                  >
                    <option value="READ_ONLY">Read Only - visitors can only view</option>
                    <option value="INTERACT">Interact - visitors can vote and comment</option>
                    <option value="FULL">Full - visitors can create posts</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {publicAccessLevel === 'READ_ONLY'
                      ? 'Non-members can browse but cannot vote, comment, or create posts.'
                      : publicAccessLevel === 'INTERACT'
                        ? 'Logged-in non-members can vote and comment. Posts and boards require membership.'
                        : 'Logged-in non-members can create posts. Full participation without joining.'}
                  </p>
                </label>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Members */}
        <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Members</h2>
            <p className="text-sm text-muted-foreground">
              Manage workspace members, roles, and invitations.
            </p>
          </div>

          <Link
            to={`/w/${workspaceId}/members`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80"
          >
            Manage Members
          </Link>
        </section>

        {/* Danger Zone */}
        <section className="space-y-6 rounded-2xl border border-destructive/20 bg-card p-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete this workspace and all its data. This action cannot be undone.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80"
          >
            Delete Workspace
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() =>
          deleteWorkspaceMutation.mutate(workspaceId!, {
            onSuccess: () => navigate('/w', { replace: true }),
          })
        }
        title="Delete Workspace"
        message={`This will permanently delete the workspace "${workspace.name}" and all its boards, posts, comments, and votes. This action cannot be undone.`}
        confirmLabel="Delete Workspace"
        confirmInput={workspace.name}
        isLoading={deleteWorkspaceMutation.isPending}
      />

      <ConfirmDialog
        open={showVisibilityDialog}
        onClose={() => {
          setShowVisibilityDialog(false);
          setPendingVisibility(null);
          setPendingAccessLevel(null);
        }}
        onConfirm={() => {
          if (!pendingVisibility) return;
          setVisibility(pendingVisibility);
          if (pendingAccessLevel) setPublicAccessLevel(pendingAccessLevel);
          setShowVisibilityDialog(false);
          updateVisibilityMutation.mutate(
            {
              workspaceId: workspaceId!,
              data: {
                visibility: pendingVisibility,
                publicAccessLevel:
                  pendingVisibility === 'PUBLIC' ? (pendingAccessLevel ?? publicAccessLevel) : undefined,
              },
            },
            {
              onError: (error) => {
                toast.error(error instanceof Error ? error.message : 'Failed to update visibility');
                setVisibility(workspace.visibility);
                setPublicAccessLevel(workspace.publicAccessLevel);
              },
            },
          );
          setPendingVisibility(null);
          setPendingAccessLevel(null);
        }}
        title="Change Visibility"
        message={
          visibility === 'PRIVATE' && pendingVisibility === 'PUBLIC'
            ? 'Making this workspace PUBLIC will allow anyone to view its boards and posts. Are you sure?'
            : 'Making this workspace PRIVATE will hide it from public view. Only members will be able to access it. Are you sure?'
        }
        confirmLabel="Make Public"
        variant="danger"
        isLoading={updateVisibilityMutation.isPending}
      />
    </main>
  );
}
