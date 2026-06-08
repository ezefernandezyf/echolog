# Tasks: Phase 17-B — Permissions & Board Approval

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~820-1070 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 (Feature Branch Chain) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation — Prisma + contracts + checkPermission | PR 1 | base = tracker; enums, fields, BoardRequest model, migration, Zod enums/DTOs, helper util |
| 2 | Service-layer gating — boards/comments/workspaces | PR 2 | base = PR 1; wire field reads into service methods, replace hardcoded role arrays, owner-only update gate |
| 3 | Board requests module — server | PR 3 | base = PR 2; service/controller/router, slug validation, BOARD_REQUEST notifications, app.ts mount |
| 4 | Permissions UI + visibility modal fix | PR 4 | base = PR 3; workspace-settings-page permissions section, direction-aware confirm message |
| 5 | Board approval UI | PR 5 | base = PR 4; API client, hooks, query keys, policy-aware create modal, request form, pending panel |

## Phase 1: Foundation

- [x] 1.1 **RED** — Write unit tests for `checkPermission()` helper: OWNER always passes, ADMIN passes ADMINS/MEMBERS, MEMBER passes MEMBERS only, NOBODY always false
- [x] 1.2 **GREEN** — Add `WorkspacePermissionLevel` and `BoardCreationPolicy` enums, `BoardRequestStatus` enum, `BOARD_REQUEST` notification type, 4 Workspace fields, BoardRequest model to `server/prisma/schema.prisma`
- [x] 1.3 **GREEN** — Create Prisma migration: `add_workspace_permissions_board_requests`
- [x] 1.4 **GREEN** — Add enums (`WorkspacePermissionLevelSchema`, `BoardCreationPolicySchema`, `BoardRequestStatusSchema`), `BoardRequestSchema`, `CreateBoardRequestDTOSchema`, `UpdateBoardRequestDTOSchema`, and 4 permission fields on `WorkspaceSchema`/`UpdateWorkspaceDTOSchema` to `shared/contracts/schemas.ts`
- [x] 1.5 **GREEN** — Create `checkPermission(role, WorkspacePermissionLevel): boolean` utility (shared or server-adjacent)
- [x] 1.6 **REFACTOR** — Verify existing 376 tests pass unchanged (defaults match current behavior)

## Phase 2: Service-Layer Gating

- [x] 2.1 **RED** — Write tests: `boardsService.create()` gates per `boardCreationPolicy` (ADMINS_ONLY blocks MEMBER, APPROVAL_REQUIRED blocks MEMBER, FREE gates by boardCreation); each role × permission level combination
- [x] 2.2 **RED** — Write tests: `boardsService.delete()` gates on `boardDeletion` (OWNER blocks ADMIN); `commentsService.create()` gates on `commenting` (NOBODY blocks non-owner)
- [x] 2.3 **GREEN** — Modify `server/src/boards/boards.service.ts`: `create()` reads `boardCreation` + `boardCreationPolicy` fields; `delete()` reads `boardDeletion` field — throw 403 on deny
- [x] 2.4 **GREEN** — Modify `server/src/comments/comments.service.ts`: `create()` reads `commenting` field after membership/public-access check — throw 403 on deny
- [x] 2.5 **GREEN** — Modify `server/src/workspaces/workspaces.service.ts`: `update()` accepts boardCreation/boardDeletion/commenting/boardCreationPolicy (owner-only); `list()`/`getById()` includes new fields
- [x] 2.6 **REFACTOR** — Verify all existing role-check tests pass; remove hardcoded role arrays

## Phase 3: Board Requests Module

- [ ] 3.1 **RED** — Write tests: `boardRequestsService.create()` — slug collision with Board + BoardRequest, duplicate PENDING from same user+slug → 409, BOARD_REQUEST notification fires to admins/owner
- [ ] 3.2 **RED** — Write tests: `boardRequestsService.update()` — APPROVED creates board via `boards.service.create()` + status update + notify requester; REJECTED updates only + notify; immutable after resolution → 409
- [ ] 3.3 **GREEN** — Create `server/src/boards/board-requests.service.ts`: `create()` validates slug uniqueness (Board + BoardRequest tables), creates PENDING request, fires notifications; `update()` handles APPROVED/REJECTED with board creation on approve
- [ ] 3.4 **GREEN** — Create `server/src/boards/board-requests.controller.ts`: `createBoardRequest` (POST, 201), `updateBoardRequest` (PATCH, 200)
- [ ] 3.5 **GREEN** — Create `server/src/boards/board-requests.router.ts`: `POST /` + `PATCH /:id` with `requireAdminOrOwner` on PATCH
- [ ] 3.6 **GREEN** — Mount router in `server/src/infra/app.ts` at `/api/workspaces/:workspaceId/board-requests`

## Phase 4: Permissions UI + Visibility Modal Fix

- [ ] 4.1 **RED** — Write test: Permissions section only renders when workspace role is `OWNER`
- [ ] 4.2 **GREEN** — Add Permissions section to `web/src/workspaces/components/workspace-settings-page.tsx` (3 selects: boardCreation, boardDeletion, commenting + 1 policy dropdown: boardCreationPolicy) — collapsible, owner-only
- [ ] 4.3 **GREEN** — Fix visibility confirmation modal direction-aware message: PRIVATE→PUBLIC vs PUBLIC→PRIVATE wording per spec (lines 402-406, align with spec scenarios)
- [ ] 4.4 **REFACTOR** — Verify existing workspace-settings tests pass

## Phase 5: Board Approval UI

- [ ] 5.1 **GREEN** — Create `web/src/api/board-requests.ts`: `create(workspaceId, data)` + `update(workspaceId, requestId, data)`
- [ ] 5.2 **GREEN** — Add `boardRequests` query keys to `web/src/hooks/query-keys.ts`
- [ ] 5.3 **GREEN** — Create `web/src/hooks/use-board-requests.ts`: `useCreateBoardRequest`, `useBoardRequests`, `useUpdateBoardRequest`
- [ ] 5.4 **GREEN** — Modify `web/src/boards/components/create-board-modal.tsx`: policy-aware — FREE shows current form; APPROVAL_REQUIRED shows request form redirect; ADMINS_ONLY hides for non-admin/owner
- [ ] 5.5 **GREEN** — Create `web/src/boards/components/board-request-form.tsx`: name + slug fields, submit creates pending request, toast
- [ ] 5.6 **GREEN** — Create `web/src/boards/components/pending-requests-panel.tsx`: list pending requests with approve/reject buttons for admin/owner
- [ ] 5.7 **REFACTOR** — Verify all integration paths: create board directly vs. request flow vs. blocked

## Test Inventory

| Suite | Tests | Location |
|-------|-------|----------|
| `checkPermission` helper | 5 | `server/test/permissions.test.ts` |
| `boardsService.create()` gating | 6 | `server/test/boards-permissions.test.ts` |
| `boardsService.delete()` gating | 2 | `server/test/boards-permissions.test.ts` |
| `commentsService.create()` gating | 2 | `server/test/comments-permissions.test.ts` |
| `boardRequestsService.create()` | 4 | `server/test/board-requests.test.ts` |
| `boardRequestsService.update()` | 3 | `server/test/board-requests.test.ts` |
| Permissions section visibility | 1 | `web/src/workspaces/__tests__/workspace-settings-page.test.tsx` |
