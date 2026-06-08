# Post Deletion & Admin Settings Restriction — Specs

Phase 17-A for EchoLog. Two new capabilities: authorized post deletion and workspace admin-settings toggle.

## post-deletion

### Purpose
Enable `DELETE /api/posts/:id`. Authors delete own posts; workspace admins/owners delete any post. Authorization mirrors the existing `comments.service.ts` delete pattern: author check first, then ADMIN|OWNER membership check, 403 otherwise.

### Requirements

| ID | Requirement | Strength |
|----|------------|----------|
| PD-001 | Post author MUST be able to delete their own post | MUST |
| PD-002 | Workspace admin/owner MUST be able to delete any post in their workspace | MUST |
| PD-003 | Non-author, non-admin/owner MUST receive 403 | MUST |
| PD-004 | Non-existent post MUST return 404 | MUST |

#### PD-001: Author deletes own post
- GIVEN a post with `authorId` matching the authenticated user
- WHEN `DELETE /api/posts/:id` is called
- THEN the post is deleted with 204 No Content
- AND associated votes and comments are cascade-deleted

#### PD-002: Admin/owner deletes any post
- GIVEN a post in a workspace where the authenticated user holds ADMIN or OWNER role
- AND the user is NOT the post author
- WHEN `DELETE /api/posts/:id` is called
- THEN the post is deleted with 204 No Content

#### PD-003: Unauthorized deletion
- GIVEN a post whose `authorId` does NOT match the authenticated user
- AND the user lacks ADMIN or OWNER role in the post's workspace
- WHEN `DELETE /api/posts/:id` is called
- THEN returns 403 Forbidden

#### PD-004: Post not found
- GIVEN a post ID that does not exist
- WHEN `DELETE /api/posts/:id` is called
- THEN returns 404 Not Found

## admin-settings-restriction

### Purpose
Add `adminsCanEditSettings` field to Workspace (defaults to `true` — preserves existing behavior). When `false`, ADMIN-role members receive 403 on `PATCH /api/workspaces/:id`. Only OWNER can toggle this field.

### Requirements

| ID | Requirement | Strength |
|----|------------|----------|
| AS-001 | `adminsCanEditSettings` MUST default to `true` | MUST |
| AS-002 | When `false`, ADMIN MUST receive 403 on `PATCH /api/workspaces/:id` | MUST |
| AS-003 | OWNER MUST always bypass the restriction | MUST |
| AS-004 | Only OWNER MUST be able to toggle `adminsCanEditSettings` | MUST |
| AS-005 | Workspace response MUST include `adminsCanEditSettings` | MUST |

#### AS-001: Default preserves existing behavior
- GIVEN a newly created workspace
- WHEN an ADMIN calls `PATCH /api/workspaces/:id`
- THEN the update succeeds (`adminsCanEditSettings` defaults to `true`)

#### AS-002: Admin blocked when restricted
- GIVEN a workspace with `adminsCanEditSettings = false`
- AND the authenticated user has ADMIN role
- WHEN `PATCH /api/workspaces/:id` is called
- THEN returns 403 Forbidden

#### AS-003: Owner bypass
- GIVEN a workspace with `adminsCanEditSettings = false`
- AND the authenticated user has OWNER role
- WHEN `PATCH /api/workspaces/:id` is called
- THEN the update succeeds

#### AS-004: Owner-only toggle
- GIVEN a workspace where the authenticated user has ADMIN role
- WHEN `PATCH /api/workspaces/:id` includes `adminsCanEditSettings` in the request body
- THEN `adminsCanEditSettings` is not changed
- AND other update fields are applied normally

#### AS-005: Field in workspace DTO
- GIVEN any workspace
- WHEN workspace data is returned via list, get, create, or update endpoints
- THEN `adminsCanEditSettings` is included in the response
