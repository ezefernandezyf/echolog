# Tasks: Phase 17-A — Post Delete & Admin Settings Toggle

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~380 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | size-exception |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Foundation — Contracts & Database

- [x] 1.1 Add `adminsCanEditSettings Boolean @default(true)` to Workspace in `server/prisma/schema.prisma`
- [x] 1.2 Run `pnpm run prisma:migrate --name add_admins_can_edit_settings`
- [x] 1.3 Add `adminsCanEditSettings: z.boolean()` to `WorkspaceSchema` in `shared/contracts/schemas.ts`
- [x] 1.4 Add `adminsCanEditSettings: z.boolean().optional()` to `UpdateWorkspaceDTOSchema` and `updateWorkspaceSchema`

## Phase 2: Server — Post Delete (TDD)

- [x] 2.1 RED: Write integration tests in `server/test/post-delete.test.ts` — author (204), admin/owner (204), non-author (403), missing post (404)
- [x] 2.2 GREEN: Implement `postsService.delete(postId, userId)` — lookup post with board→workspaceId, author check, admin/owner fallback, 404/403/204
- [x] 2.3 GREEN: Add `deletePost` handler → 204 to `server/src/posts/posts.controller.ts`
- [x] 2.4 GREEN: Add `router.delete('/:postId', requireAuth, requirePostMember(), deletePost)` to `server/src/posts/posts.router.ts`

## Phase 3: Server — Admin Settings Gate (TDD)

- [x] 3.1 RED: Write unit tests for `workspacesService.update()` — ADMIN blocked when false, OWNER bypasses, ADMIN input stripped
- [x] 3.2 GREEN: Gate `update()` — 403 if `!adminsCanEditSettings && ADMIN`; strip field from ADMIN input; OWNER always passes

## Phase 4: Web — API & Hooks (TDD)

- [x] 4.1 RED: Write test for `useDeletePost` — optimistic cache removal + rollback on error
- [x] 4.2 GREEN: Add `deletePost(postId)` to `web/src/api/posts.ts` — `fetchJson<void>({ method: 'DELETE', url: \`/posts/${postId}\` })`
- [x] 4.3 GREEN: Add `useDeletePost()` — `onMutate` filters post from cache, `onSettled` invalidates, toast on success/error

## Phase 5: Web — UI Integration (TDD)

- [x] 5.1 RED: Write tests for delete button visibility — visible for author/admin/owner, hidden for member/viewer
- [x] 5.2 GREEN: Add delete button (trash icon) to `web/src/boards/components/post-row.tsx` — gated on `isAuthor || isAdmin || isOwner`
- [x] 5.3 GREEN: Add delete button (trash icon) to `web/src/boards/components/post-detail-page.tsx` — gated on `isAuthor || isAdmin || isOwner`
- [x] 5.4 RED: Write test for admin-settings toggle — visible only for OWNER, hidden for ADMIN
- [x] 5.5 GREEN: Add `adminsCanEditSettings` toggle to `web/src/workspaces/components/workspace-settings-page.tsx` — owner-only switch + `useUpdateWorkspace`
