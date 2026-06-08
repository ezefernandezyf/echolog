# Design: Phase 17-B — Permissions & Board Approval

## Technical Approach

Add 4 Workspace fields (same additive pattern as `adminsCanEditSettings` — safe defaults preserve current behavior), new BoardRequest model with notification flow, and service-layer gating replacing hardcoded role arrays. Middleware untouched — authorization moves to service layer for flexibility.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Permission gating | Service layer reads Workspace fields, not middleware | Middleware unchanged; existing `requireWorkspaceMember(['OWNER','ADMIN','MEMBER'])` still passes members, service throws 403. Matches Phase 17-A pattern. |
| Permission check helper | `checkPermission(role, WorkspacePermissionLevel)` utility | OWNER always passes; ADMIN passes ADMINS/MEMBERS; MEMBER passes MEMBERS only; NOBODY always false |
| BoardRequest module | New `server/src/boards/board-requests.*` (service/controller/router) | Screaming Architecture: board-requests lives under `/boards/`, mounted at `/workspaces/:workspaceId/board-requests` |
| BoardRequest status enum | `PENDING \| APPROVED \| REJECTED` | Matches existing InvitationStatus pattern. No EXPIRED — scope excludes request expiration. |
| Slug uniqueness | Validate against Board AND BoardRequest tables | Proposal spec: `@@unique([workspaceId, slug])` on Board; BoardRequest checks `boardSlug` against both tables before creation |
| BOARD_REQUEST notification type | Prisma enum + Zod schema addition | Same pattern as existing NEW_COMMENT/INVITE_SENT/ROLE_CHANGED |
| Board creation flow | Service gated: policy + permission fields | `boardCreationPolicy=ADMINS_ONLY` → only ADMIN/OWNER pass. `APPROVAL_REQUIRED` → ADMIN/OWNER create directly, others redirected to POST board-requests. `FREE` → gate by `boardCreation`. |

## Data Flow

### Board Creation Gating (service-layer)
```
boardsService.create(workspaceId, input, userId)
  → findUnique workspaceMember
  → if not member: enforcePublicWriteAccess (existing)
  → findUnique workspace { boardCreationPolicy, boardCreation }
  → switch boardCreationPolicy:
      ADMINS_ONLY → checkPermission(role, 'ADMINS') → 403 if fail
      APPROVAL_REQUIRED → checkPermission(role, 'ADMINS') → 403 if fail (MEMBER must use board-requests)
      FREE → checkPermission(role, boardCreation) → 403 if fail
  → continue with existing slug check + create
```

### Board Request Flow
```
POST /workspaces/:wid/board-requests { boardName, boardSlug }
  → boardRequestsService.create()
    → validate slug against Board (workspaceId_slug) + BoardRequest (workspaceId+boardSlug)
    → if duplicate PENDING from same user+slug → 409
    → create BoardRequest { status: PENDING }
    → notificationsService.create(BOARD_REQUEST, ws admins/owner)
  → 201

PATCH /workspaces/:wid/board-requests/:id { status: APPROVED|REJECTED }
  → requireAdminOrOwner middleware
  → boardRequestsService.update()
    → findUnique BoardRequest → 404 if !found
    → if status !== PENDING → 409 immutable
    → if APPROVED:
        → boardsService.create(workspaceId, { name: boardName, description: null }, requesterId)
        → status = APPROVED
        → notify requester
    → if REJECTED:
        → status = REJECTED
        → notify requester
  → 200
```

### Comment/Delete Gating
```
boardsService.delete(boardId, userId) — replace `['OWNER','ADMIN']` with read workspace.boardDeletion
commentsService.create(postId, input, userId) — add read workspace.commenting → 403 if fails check
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `server/prisma/schema.prisma` | Modify | Add `WorkspacePermissionLevel` enum, `BoardCreationPolicy` enum, 4 fields on Workspace, `BoardRequest` model, `BoardRequestStatus` enum, `BOARD_REQUEST` to NotificationType |
| `shared/contracts/schemas.ts` | Modify | Add enums, `BoardRequest` DTOs, `CreateBoardRequestDTO`, `UpdateBoardRequestDTO`, fields on WorkspaceSchema/UpdateWorkspaceDTOSchema |
| `server/src/boards/board-requests.service.ts` | Create | Create/update BoardRequest, gated slug validation, notify admins or requester, create board on approve |
| `server/src/boards/board-requests.controller.ts` | Create | `createBoardRequest`, `updateBoardRequest` handlers |
| `server/src/boards/board-requests.router.ts` | Create | `POST /` + `PATCH /:id` with `requireAdminOrOwner` on PATCH |
| `server/src/boards/boards.service.ts` | Modify | `create()` gates on `boardCreation` + `boardCreationPolicy`; `delete()` gates on `boardDeletion` |
| `server/src/comments/comments.service.ts` | Modify | `create()` gates on `commenting` after membership/public-access check |
| `server/src/workspaces/workspaces.service.ts` | Modify | `update()` accepts new permission fields (owner-only); `WorkspaceDTO` includes new fields |
| `server/src/infra/app.ts` | Modify | Mount board-requests router at `/workspaces/:workspaceId/board-requests` |
| `web/src/workspaces/components/workspace-settings-page.tsx` | Modify | Owner-only "Permissions" section: 3 selects + 1 policy dropdown; fix visibility confirm message |
| `web/src/boards/components/create-board-modal.tsx` | Modify | Policy-aware: free/create form vs. request form vs. hidden |
| `web/src/boards/components/board-request-form.tsx` | Create | Request submission form for APPROVAL_REQUIRED policy |
| `web/src/boards/components/pending-requests-panel.tsx` | Create | Admin/owner panel to approve/reject pending requests |
| `web/src/api/board-requests.ts` | Create | `create()`, `update()` API functions |
| `web/src/hooks/use-board-requests.ts` | Create | `useCreateBoardRequest()`, `useBoardRequests()`, `useUpdateBoardRequest()` |
| `web/src/hooks/query-keys.ts` | Modify | Add `boardRequests: { list: ... }` query key |

## Interfaces / Contracts

```ts
// shared/contracts/schemas.ts — additions

export const WorkspacePermissionLevelSchema = z.enum(['OWNER', 'ADMINS', 'MEMBERS', 'NOBODY']);
export type WorkspacePermissionLevel = z.infer<typeof WorkspacePermissionLevelSchema>;

export const BoardCreationPolicySchema = z.enum(['FREE', 'APPROVAL_REQUIRED', 'ADMINS_ONLY']);
export type BoardCreationPolicy = z.infer<typeof BoardCreationPolicySchema>;

export const BoardRequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type BoardRequestStatus = z.infer<typeof BoardRequestStatusSchema>;

// Update NotificationType:
export const NotificationTypeSchema = z.enum(['INVITE_SENT', 'ROLE_CHANGED', 'NEW_COMMENT', 'BOARD_REQUEST']);

// WorkspaceSchema gets:
//   boardCreation: WorkspacePermissionLevel
//   boardDeletion: WorkspacePermissionLevel
//   commenting: WorkspacePermissionLevel
//   boardCreationPolicy: BoardCreationPolicy

// UpdateWorkspaceDTOSchema gets:
//   boardCreation: WorkspacePermissionLevel.optional()
//   boardDeletion: WorkspacePermissionLevel.optional()
//   commenting: WorkspacePermissionLevel.optional()
//   boardCreationPolicy: BoardCreationPolicy.optional()

export const BoardRequestSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  userId: z.string(),
  userName: z.string().nullable(),
  boardName: z.string(),
  boardSlug: z.string(),
  status: BoardRequestStatusSchema,
  createdAt: z.string(),
});

export const CreateBoardRequestDTOSchema = z.object({
  boardName: z.string().trim().min(1, 'Board name is required').max(120),
  boardSlug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/),
});

export const UpdateBoardRequestDTOSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `boardsService.create()` gates | Test each permission level × user role combination; default = MEMBERS passes for member |
| Unit | `boardsService.delete()` gates | boardDeletion=OWNER blocks admin, boardDeletion=ADMINS passes admin |
| Unit | `commentsService.create()` gates | commenting=NOBODY blocks all non-owner |
| Unit | `boardRequestsService.create()` | Slug collision with Board + BoardRequest, duplicate PENDING, notification fires |
| Unit | `boardRequestsService.update()` | APPROVED creates board + status update; REJECTED updates only; immutable after resolution |
| Web | Permissions section visibility | Only rendered when `role === 'OWNER'` |
| Web | Policy-aware board creation | FREE shows form, APPROVAL_REQUIRED shows request form, ADMINS_ONLY hides for non-admin |

## Migration / Rollout

```bash
pnpm run prisma:migrate --name add_workspace_permissions_board_requests
```

`@default()` values preserve current behavior: `boardCreation: MEMBERS`, `boardDeletion: ADMINS`, `commenting: MEMBERS`, `boardCreationPolicy: FREE`. BoardRequest table is additive. Revert: fields can stay (safe) or roll back migration; new module can be removed from app.ts.

## Open Questions

None.
