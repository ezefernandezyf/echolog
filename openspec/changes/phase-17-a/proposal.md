# Proposal: Phase 17-A — Post Delete & Admin Settings Toggle

## Intent

EchoLog has **no post deletion** endpoint — posts are permanently immutable once created. Workspace admins can always modify settings with no owner-level override. These gaps block basic content management and admin delegation control.

## Scope

### In Scope
- `DELETE /api/posts/:id` — post author deletes own post; workspace admin/owner deletes any post
- `adminsCanEditSettings Boolean @default(true)` on Workspace model — when `false`, admins cannot call `PATCH /api/workspaces/:id`
- UI: delete button on posts (visible to author, admin, owner); admin-settings toggle in workspace settings (owner-only)
- Shared contracts: `WorkspaceSchema` and `UpdateWorkspaceDTOSchema` include `adminsCanEditSettings`
- Prisma migration for new workspace field

### Out of Scope
- Soft-delete or post archival (hard delete only)
- Workspace permission granularity (Phase 17-B)
- Board approval flow (Phase 17-B)

## Capabilities

### New Capabilities
- `post-deletion`: Authorized post deletion by author or workspace admin/owner
- `admin-settings-restriction`: Owner-controlled toggle preventing admins from modifying workspace settings

### Modified Capabilities
None — net-new behavior; no existing spec-level requirements change.

## Approach

**Post Deletion** — Mirror `comments.service.ts:delete()` pattern:
1. Find post, resolve `workspaceId` via `board.workspaceId` relation
2. 404 if not found
3. If `post.authorId === userId` → delete (author path)
4. Else check workspace membership → require `ADMIN | OWNER` role, 403 otherwise
5. Web: API function + `useDeletePost` mutation with optimistic cache removal, following `useDeleteComment` pattern

**Admin Settings Toggle** — Add field to Workspace model. Gate `workspaces.service.ts:update()`: if `!adminsCanEditSettings && membership.role === 'ADMIN'` → 403. UI: owner-only toggle in `workspace-settings-page.tsx`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `server/prisma/schema.prisma` | Modified | Add `adminsCanEditSettings` field to Workspace |
| `server/src/posts/posts.service.ts` | New method | `delete()` with author + admin/owner auth |
| `server/src/posts/posts.controller.ts` | New handler | `deletePost()` controller |
| `server/src/posts/posts.router.ts` | New route | `DELETE /:postId` |
| `server/src/workspaces/workspaces.service.ts` | Modified | Gate `update()` on `adminsCanEditSettings` |
| `shared/contracts/schemas.ts` | Modified | Add field to workspace schemas |
| `web/src/api/posts.ts` | New function | `deletePost()` |
| `web/src/hooks/use-posts.ts` | New hook | `useDeletePost()` mutation |
| `web/src/workspaces/components/workspace-settings-page.tsx` | Modified | Owner-only admin-settings toggle |
| Post detail/list components | Modified | Delete button for authorized users |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cascade deletes leave orphans | Low | Prisma schema already has `onDelete: Cascade` on Post→Vote, Post→Comment |
| Migration breaks existing data | Low | `@default(true)` preserves current behavior |

## Rollback Plan

1. Revert Prisma migration (field with default is safe to keep)
2. Remove DELETE route, service method, controller handler
3. Remove `adminsCanEditSettings` gate from `update()` and UI toggle
4. All changes are additive — reverting any piece won't break existing functionality

## Dependencies

- Independent change; no prerequisite from prior phases
- Relies on existing `requireAuth`, `requirePostMember` middleware and `comments.service.ts` delete auth pattern

## Success Criteria

- [ ] `DELETE /api/posts/:id` returns 204 for author (own post) and admin/owner (any post)
- [ ] `DELETE /api/posts/:id` returns 403 for non-author, non-admin/owner users
- [ ] `PATCH /api/workspaces/:id` returns 403 for ADMIN when `adminsCanEditSettings` is `false`
- [ ] OWNER can toggle `adminsCanEditSettings` in settings UI
- [ ] Delete button visible on posts only for author, admin, or owner
- [ ] Existing 376 tests continue to pass
