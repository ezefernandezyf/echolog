# Specs: Phase 17-B — Permissions & Board Approval

## workspace-permissions (NEW)

### Purpose
Granular Workspace permission fields controlling board creation, board deletion, and commenting by role tier.

### Requirements

| ID | Requirement | Strength | Summary |
|----|-------------|----------|---------|
| WP-001 | Workspace exposes `boardCreation`, `boardDeletion`, `commenting` (enum OWNER\|ADMINS\|MEMBERS\|NOBODY) and `boardCreationPolicy` (enum FREE\|APPROVAL_REQUIRED\|ADMINS_ONLY) | MUST | Four new fields with defaults preserving current behavior |
| WP-002 | Defaults: boardCreation=MEMBERS, boardDeletion=ADMINS, commenting=MEMBERS, boardCreationPolicy=FREE | MUST | Migration-safe — existing tests pass unchanged |
| WP-003 | Only OWNER updates permission fields via PATCH /api/workspaces/:id | MUST | ADMINS/MEMBERS receive 403 |
| WP-004 | Service-layer enforcement gates boards.create() on boardCreation + boardCreationPolicy | MUST | When boardCreationPolicy=ADMINS_ONLY, boardCreation is ignored |
| WP-005 | Service-layer enforcement gates boards.delete() on boardDeletion | MUST | Replaces hardcoded ['OWNER','ADMIN'] check |
| WP-006 | Service-layer enforcement gates comments.create() on commenting | MUST | Replaces hardcoded ['OWNER','ADMIN','MEMBER'] check |

#### Scenario: Defaults preserve existing behavior
- GIVEN workspace with default permission values
- WHEN any member performs board creation, board deletion, or commenting
- THEN behavior matches pre-17-B hardcoded rules (MEMBERS create boards/comment; ADMINS delete boards)

#### Scenario: boardCreationPolicy ADMINS_ONLY blocks members
- GIVEN workspace with `boardCreationPolicy: ADMINS_ONLY`
- WHEN MEMBER submits POST /api/boards
- THEN 403 regardless of boardCreation value

#### Scenario: commenting=NOBODY blocks all non-owner
- GIVEN workspace with `commenting: NOBODY`
- WHEN MEMBER/ADMIN submits POST /api/posts/:id/comments
- THEN 403; only OWNER bypasses

#### Scenario: boardDeletion=OWNER blocks admins
- GIVEN workspace with `boardDeletion: OWNER`
- WHEN ADMIN submits DELETE /api/boards/:id
- THEN 403

#### Scenario: Non-owner cannot change permissions
- GIVEN membership role is MEMBER or ADMIN
- WHEN PATCH /api/workspaces/:id includes permission field changes
- THEN 403; fields unchanged

---

## board-approval (NEW)

### Purpose
Board creation request/approval flow with BoardRequest model and BOARD_REQUEST notifications.

### Requirements

| ID | Requirement | Strength | Summary |
|----|-------------|----------|---------|
| BA-001 | POST /api/workspaces/:id/board-requests creates PENDING BoardRequest with boardName, boardSlug, userId, workspaceId | MUST | Fires BOARD_REQUEST notification to admins/owner |
| BA-002 | Slug validated against Board AND BoardRequest tables for uniqueness | MUST | 409 on collision with existing board or pending request |
| BA-003 | Duplicate PENDING request from same user+slug returns 409 | MUST | Prevents spam |
| BA-004 | PATCH /api/workspaces/:id/board-requests/:id { status: APPROVED } creates board via boards.service.create() | MUST | Updates status to APPROVED; notifies requester |
| BA-005 | PATCH ... { status: REJECTED } updates status only — no board created | MUST | Notifies requester |
| BA-006 | Only ADMIN/OWNER can approve or reject | MUST | MEMBER/VIEWER receive 403 |
| BA-007 | Once APPROVED or REJECTED, further status changes return 409 | MUST | Immutable after resolution |

#### Scenario: Member submits request under APPROVAL_REQUIRED policy
- GIVEN workspace with `boardCreationPolicy: APPROVAL_REQUIRED`
- WHEN MEMBER submits POST /api/workspaces/:id/board-requests with valid { boardName, boardSlug }
- THEN BoardRequest created with PENDING status AND BOARD_REQUEST notification fires to admins/owner

#### Scenario: Slug collision with existing board
- GIVEN board with slug "roadmap" exists
- WHEN member submits board request with slug "roadmap"
- THEN 409 Conflict

#### Scenario: Slug collision with pending request
- GIVEN PENDING BoardRequest with slug "ideas" exists
- WHEN another member submits request with slug "ideas"
- THEN 409 Conflict

#### Scenario: Admin approves request
- GIVEN PENDING BoardRequest
- WHEN ADMIN patches { status: APPROVED }
- THEN board created with requested name/slug AND status → APPROVED AND requester notified

#### Scenario: Admin rejects request
- GIVEN PENDING BoardRequest
- WHEN ADMIN patches { status: REJECTED }
- THEN status → REJECTED AND no board created AND requester notified

#### Scenario: Already-processed request is immutable
- GIVEN BoardRequest with status APPROVED or REJECTED
- WHEN patched with any status change
- THEN 409 Conflict

---

## workspace-settings — MODIFIED (visibility-modal-directional)

### MODIFIED Requirements

#### Requirement: Visibility confirmation modal
The visibility confirmation dialog MUST show a direction-aware message. The text SHALL differ for PRIVATE→PUBLIC vs. PUBLIC→PRIVATE transitions.

(Previously: confirmation used a single generic message; existing code had conditional text but minor wording differences.)

#### Scenario: PRIVATE → PUBLIC confirmation
- GIVEN workspace visibility is PRIVATE
- WHEN owner sets visibility to PUBLIC and confirmation modal appears
- THEN message: "Making this workspace PUBLIC will allow anyone to view its boards and posts. Are you sure?"

#### Scenario: PUBLIC → PRIVATE confirmation
- GIVEN workspace visibility is PUBLIC
- WHEN owner sets visibility to PRIVATE and confirmation modal appears
- THEN message: "Making this workspace PRIVATE will hide it from public view. Only members will be able to access it. Are you sure?"
