# Design: Phase 17-A — Post Delete & Admin Settings Toggle

## Technical Approach

Two independent features. Post deletion mirrors `comments.service.ts:delete()` — author check first, then ADMIN|OWNER membership, 204 on success. Admin settings toggle adds `adminsCanEditSettings` boolean to Workspace model (default `true`), gates `update()` when `false + ADMIN` role, and strips the field from admin input.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Post delete auth | Service-layer — mirror comments delete | Existing pattern is well-reviewed; consistency reduces cognitive overhead |
| Optimistic removal | `useDeletePost` filters from cache onMutate, invalidates onSettled | Follows `useDeleteComment`; immediate UX feedback with rollback |
| Admin field stripping | Service strips `adminsCanEditSettings` when caller is ADMIN | Security boundary — frontend can't be trusted |
| Delete button visibility | Client gate (`isAuthor \|\| isAdmin \|\| isOwner`) + server 403 | Dual guard follows existing post controls pattern |
| Workspace role for UI | Derived from `useWorkspaces()` query cache | Cache hit — no extra fetch; avoids prop drilling through virtualized list |

## Data Flow

### Post Delete
```
DELETE /api/posts/:postId
  → requireAuth → requirePostMember() [workspace visibility]
  → postsService.delete(postId, userId)
    → findUnique post { include: { board: { select: { workspaceId } } } }
    → 404 if !post
    → post.authorId === userId ? DELETE ✓
    → else: findUnique workspaceMember → ADMIN|OWNER ? DELETE ✓ : 403 ✗
  → 204
  → Prisma cascades: Vote, Comment (onDelete: Cascade already set)
```

### Admin Settings Toggle
```
PATCH /api/workspaces/:id { adminsCanEditSettings: false }
  → workspacesService.update(id, input, userId)
    → findUnique membership → 403 if !OWNER|ADMIN
    → OWNER: always passes, field forwarded to prisma.update
    → ADMIN: if !workspace.adminsCanEditSettings → 403
    → ADMIN: strip adminsCanEditSettings from input before update
  → 200 workspaceDTO (with adminsCanEditSettings)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `server/prisma/schema.prisma` | Modify | `adminsCanEditSettings Boolean @default(true)` on Workspace |
| `server/src/posts/posts.service.ts` | Modify | Add `delete(postId, userId)` — auth logic mirroring comments |
| `server/src/posts/posts.controller.ts` | Modify | Add `deletePost` → 204 |
| `server/src/posts/posts.router.ts` | Modify | `router.delete('/:postId', requireAuth, requirePostMember(), deletePost)` |
| `server/src/workspaces/workspaces.service.ts` | Modify | Gate `update()` on `adminsCanEditSettings` + strip for ADMIN |
| `shared/contracts/schemas.ts` | Modify | `adminsCanEditSettings` in WorkspaceSchema, UpdateWorkspaceDTOSchema, updateWorkspaceSchema |
| `web/src/api/posts.ts` | Modify | `deletePost(postId)` → `DELETE /posts/:id` |
| `web/src/hooks/use-posts.ts` | Modify | `useDeletePost()` with optimistic cache removal |
| `web/src/boards/components/post-row.tsx` | Modify | Delete button (trash icon) for author + admin/owner |
| `web/src/boards/components/post-detail-page.tsx` | Modify | Delete button in post detail view |
| `web/src/workspaces/components/workspace-settings-page.tsx` | Modify | Owner-only toggle for `adminsCanEditSettings` |

## Interfaces / Contracts

```ts
// shared/contracts/schemas.ts — additions:
WorkspaceSchema: { ..., adminsCanEditSettings: z.boolean() }
UpdateWorkspaceDTOSchema: { ..., adminsCanEditSettings: z.boolean().optional() }
updateWorkspaceSchema: { ..., adminsCanEditSettings: z.boolean().optional() }

// web/src/api/posts.ts — addition:
deletePost: (postId: string) =>
  fetchJson<void>({ url: `/posts/${postId}`, method: 'DELETE' }),
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `postsService.delete()` | Author → 204; Admin/owner → 204; Non-member → 403; Missing post → 404 |
| Unit | `workspacesService.update()` gating | ADMIN blocked when `adminsCanEditSettings=false`; OWNER bypasses; ADMIN input stripped |
| Web | `useDeletePost` mutation | Optimistic removal from posts list cache; rollback on error |
| Web | Delete button visibility | Rendered for author+admin+owner; hidden for member+viewer |
| Web | Admin toggle visibility | Only rendered when `role === 'OWNER'` |

## Migration / Rollout

```bash
pnpm run prisma:migrate --name add_admins_can_edit_settings
```

`@default(true)` preserves current behavior — no data migration needed. Revert: field is additive; safe to keep or roll back.

## Open Questions

None.
