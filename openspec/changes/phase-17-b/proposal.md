# Proposal: Phase 17-B — Permissions & Board Approval

## Intent

EchoLog permissions are hardcoded: all members create boards, all admins delete anything. Workspace owners need per-action granularity plus an approval gate for board creation.

## Scope

### In Scope
- Three granular permission fields on Workspace: `boardCreation`, `boardDeletion`, `commenting` — enum `OWNER | ADMINS | MEMBERS | NOBODY`, defaults matching current behavior (MEMBERS, ADMINS, MEMBERS)
- `boardCreationPolicy` field: `FREE | APPROVAL_REQUIRED | ADMINS_ONLY`, default `FREE`
- BoardRequest Prisma model: `workspaceId`, `userId`, `boardName`, `boardSlug`, `status: PENDING | APPROVED | REJECTED`, timestamps
- BOARD_REQUEST notification type + notification firing on request events
- `POST /api/workspaces/:id/board-requests` (submit) + `PATCH /api/workspaces/:id/board-requests/:id` (approve/reject)
- Service-layer enforcement reading workspace fields instead of hardcoded role lists for boards create/delete and comments create
- Owner-only Permissions section in workspace settings UI (three dropdowns + policy toggle)
- Policy-aware board creation form (direct vs. request flow); pending requests dashboard for admins/owner
- **Fix visibility confirmation modal**: show correct message based on direction — "Making this workspace PUBLIC..." when PRIVATE→PUBLIC, "Making this workspace PRIVATE..." when PUBLIC→PRIVATE

### Out of Scope
- Permissions beyond boardCreation, boardDeletion, commenting (post/members/visibility remain hardcoded)
- Real-time notifications (polling only, same as existing)
- Soft-delete or request expiration
- UI for boardDeletion/commenting in board/post detail views

## Capabilities

### New Capabilities
- `workspace-permissions`: Granular workspace-level permission fields controlling board creation, board deletion, and commenting by role tier
- `board-approval`: Board creation request flow with approval/rejection, BoardRequest model, notifications

### Modified Capabilities
- `workspace-settings`: Visibility confirmation modal now shows direction-aware messages (PUBLIC→PRIVATE vs. PRIVATE→PUBLIC)

## Approach

**1. Permission fields** — Add enum `WorkspacePermissionLevel` (`OWNER, ADMINS, MEMBERS, NOBODY`) and enum `BoardCreationPolicy` (`FREE, APPROVAL_REQUIRED, ADMINS_ONLY`). Add fields to Workspace model with `@default` matching current hardcoded behavior. Same pattern as `adminsCanEditSettings`. Migration safe — defaults preserve existing behavior.

**2. Service enforcement** — `boards.service.ts:create()` gates on workspace permission + policy fields. `boards.service.ts:delete()` and `comments.service.ts:create()` gate on workspace permission fields instead of inline role arrays. Middleware unchanged; authorization moves to service layer for flexibility.

**3. BoardRequest** — Mirror `WorkspaceInvitation` model: status enum, JSON endpoints, no token. `POST /api/workspaces/:id/board-requests` validates slug uniqueness against both Board and BoardRequest tables, creates PENDING request, fires BOARD_REQUEST notification to workspace admins/owner. `PATCH .../:id` with `{ status: APPROVED | REJECTED }` — on APPROVED creates the board via existing `boards.service.create()`, fires notification back to requester. On REJECTED fires notification.

**4. New module** — `server/src/boards/board-requests.service.ts`, `.controller.ts`, `.router.ts` (Screaming Architecture). Frontend: policy-aware board creation form, pending requests dashboard component.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `server/prisma/schema.prisma` | Modified | 4 fields on Workspace, BoardRequest model, BoardRequestStatus enum, BOARD_REQUEST notification type |
| `server/src/boards/boards.service.ts` | Modified | Gate create/delete on workspace permission fields |
| `server/src/comments/comments.service.ts` | Modified | Gate create on workspace permission field |
| `server/src/workspaces/workspaces.service.ts` | Modified | Accept permission fields in update DTO |
| `server/src/boards/board-requests.*` | New (3 files) | Service, controller, router |
| `server/src/notifications/notifications.service.ts` | Modified | Fire BOARD_REQUEST notifications |
| `shared/contracts/schemas.ts` | Modified | Permission enums, BoardRequest schemas, workspace schema update |
| `web/src/workspaces/components/workspace-settings-page.tsx` | Modified | Permissions section (owner-only) |
| `web/src/boards/components/` | New/Mod | Policy-aware create form, pending requests dashboard |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Auth refactor (middleware→service) breaks existing tests | Medium | Defaults replicate current behavior exactly; run full suite before/after each layer change |
| Slug collision: pending request vs. existing board | Low | Validate uniqueness against Board AND BoardRequest tables |
| Migration defaults lock out members incorrectly | Low | Explicit `@default()` values match current hardcoded behavior |
| UI complexity: 3 dropdowns + policy toggle | Medium | Reuse existing Select patterns from members/visibility; single collapsible Permissions section |

## Rollback Plan

1. Revert Prisma migration (fields with defaults are safe to keep)
2. Remove `board-requests.*` module and route wiring in `server/src/infra/app.ts`
3. Revert service-layer permission checks to hardcoded role arrays
4. Remove Permissions section from workspace settings UI
5. All changes additive — existing boards, comments, memberships unaffected

## Dependencies

- Phase 17-A merged first (borrows same workspace-field pattern for `adminsCanEditSettings`)
- Existing middleware (`requireWorkspaceMember`), notification service, WorkspaceInvitation pattern

## Success Criteria

- [ ] Owner sets `boardCreation: ADMINS_ONLY` — members get 403 on `POST /api/boards`
- [ ] Owner sets `boardCreationPolicy: APPROVAL_REQUIRED` — members see request form; submission creates PENDING BoardRequest + notification
- [ ] Admin approves PENDING request — board created via `boards.service.create()`, requester notified
- [ ] Admin rejects PENDING request — status REJECTED, requester notified
- [ ] `commenting: NOBODY` — `POST /api/posts/:id/comments` returns 403 for MEMBER/VIEWER
- [ ] `boardDeletion: ADMINS` (default) preserves current behavior — members get 403
- [ ] Default values (MEMBERS/MEMBERS/ADMINS/FREE) → existing 376 tests pass unchanged
- [ ] Permissions UI section only visible to OWNER role
