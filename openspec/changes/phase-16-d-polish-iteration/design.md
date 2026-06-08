# Design: Phase 16-D Polish Iteration

## Technical Approach

Seven frontend-only fixes across 6 files. Items 1/3/4/5/7 are single-file edits ≤10 lines each. Items 2 and 6 are component refactors: PublicBoardView gains interactive controls via new `PublicPostRow`; TopNavbar gets an avatar dropdown matching the notification-bell pattern.

## Architecture Decisions

### Decision: Public post interaction — dedicated PublicPostRow vs reusing PostRow

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Use PostRow from boards/ | Maps PostDTO→PostRowData, status controls leak into public view, navigates to `/w/:workspaceId/p/:id` (wrong route) | ❌ Rejected |
| New PublicPostRow component | Clean separation, no status controls, correct public routing, reuses CommentSection directly | ✅ **Chosen** |

**Rationale**: PostRow uses authenticated routes (`useParams workspaceId`, status controls). Dedicated component avoids conditionals and keeps public interaction explicit.

### Decision: Avatar dropdown — shared component vs inline pattern

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Extract shared Dropdown from notification bell | Creates reusable primitive, adds refactor scope | ❌ Rejected (scope creep) |
| Inline pattern matching PendingInvitationsBell | Consistent with existing codebase, zero new abstractions | ✅ **Chosen** |

**Rationale**: No shared Dropdown exists. All dropdowns use the same pattern (relative container, absolute positioned, fixed backdrop for click-outside). Matching this avoids adding abstraction scope.

### Decision: workspace accessLevel in PublicBoardView

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Fetch workspace detail + board detail | Two parallel queries, accessLevel available from existing endpoint, no server changes | ✅ **Chosen** |
| Add accessLevel to PublicBoardDetailDTO | Server change required, violates "no new API endpoints" | ❌ Rejected |

**Rationale**: `publicApi.getWorkspaceBySlug()` already returns `publicAccessLevel`. Parallel fetch = minimal change, zero server impact.

### Decision: Post query invalidation prefix

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `['posts', boardId]` (2-element prefix) | Matches all board-scoped queries via React Query prefix matching | ✅ **Chosen** |
| Fix query key factory | More changes across all invalidation sites, risk of regression | ❌ Rejected |

**Rationale**: Single-line change, React Query v5 prefix matching works correctly with 2-element keys.

## Data Flow

```
PublicBoardView
  ├─ publicApi.getWorkspaceBySlug(slug)      → publicAccessLevel
  ├─ publicApi.getBoardBySlug(slug, boardSlug) → board + PostDTO[]
  └─ PublicPostRow (per post)
       ├─ voteApi.addVote/removeVote          → gated by auth × accessLevel
       └─ CommentSection                      → gated by auth × accessLevel

TopNavbar
  ├─ PendingInvitationsBell                  → moved from sidebar
  ├─ ThemeToggle                             → kept in TopNavbar
  └─ AvatarDropdown                          → initials, Settings, Sign out (ConfirmDialog)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web/src/public/public-workspace-view.tsx` | Modify | BoardCard `to` prop: add `/${board.slug}` |
| `web/src/public/public-board-view.tsx` | Modify | Replace local PostRow with new PublicPostRow (vote, comment, create-post) gated by accessLevel + auth |
| `web/src/hooks/use-posts.ts` | Modify | `useCreatePost` invalidation: use 2-element key prefix `['posts', boardId]` |
| `web/src/core/store/ui-store.ts` | Modify | Add `toggleSidebar` action |
| `web/src/auth/authenticated-layout.tsx` | Modify | Wire `toggleSidebar` instead of `openSidebar` to TopNavbar |
| `web/src/shared/components/landing-page.tsx` | Modify | Delete lines 71-79 (duplicate "Continue without account" CTA) |
| `web/src/auth/top-navbar.tsx` | Modify | Add PendingInvitationsBell + avatar dropdown (initials, Settings, Sign out) |
| `web/src/boards/components/sidebar.tsx` | Modify | Remove bottom section (ThemeToggle, bell, user card); conditional Explore link via `!workspaceId` |

## Interfaces / Contracts

### PublicPostRow props

```tsx
interface PublicPostRowProps {
  post: PostDTO;
  boardId: string;
  workspaceSlug: string;
  accessLevel: 'READ_ONLY' | 'INTERACT' | 'FULL';
  isAuthenticated: boolean;
}
```

### UiStore toggleSidebar

```ts
toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
```

### Query invalidation fix (useCreatePost)

```ts
queryClient.invalidateQueries({ queryKey: ['posts', variables.boardId] });
```

## Access Level Gate Matrix

| Condition | Vote | Comment | Create Post |
|-----------|------|---------|-------------|
| `!isAuthenticated` | ✗ | ✗ | ✗ |
| `READ_ONLY` | ✗ | ✗ | ✗ |
| `INTERACT` + auth | ✓ | ✓ | ✗ |
| `FULL` + auth | ✓ | ✓ | ✓ |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | UiStore toggleSidebar | Verify state flips on each call |
| Unit | BoardCard link | Verify href includes board.slug |
| Unit | Post query invalidation key | Verify 2-element prefix matches infinite query key |
| Integration | PublicBoardView interaction | Mount with mock workspace/board data, verify controls render per access level matrix |
| Integration | Avatar dropdown | Mount TopNavbar with auth session, verify initials + dropdown items |
| Unit | Sidebar Explore link | Render with `workspaceId=""` → visible; with `workspaceId="abc"` → hidden |
| Lint | Landing page duplicate CTA | Verify "Continue without account" not in rendered DOM |

No migration required.

## Open Questions

None.
