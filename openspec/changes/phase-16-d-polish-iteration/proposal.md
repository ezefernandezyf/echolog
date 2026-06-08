# Proposal: Phase 16-D — Polish Iteration

## Intent

Phase 16 merged to `develop` left 7 execution gaps: 4 bugs and 3 UX papercuts. BoardCard links to wrong route, public boards lack interactive controls, post lists don't refresh after creation, hamburger button is a no-op on desktop, duplicate CTA on landing, sidebar has wrong component placement, and Explore link leaks into workspace context. All fixable with scoped changes — no schema migrations, no new services.

## Scope

### In Scope
1. **Fix BoardCard link** — add `board.slug` to href in `public-workspace-view.tsx`
2. **Add interaction controls to PublicBoardView** — vote buttons, comment form, create-post button gated by `publicAccessLevel`
3. **Fix query invalidation for post creation** — align query key prefixes between `useCreatePost` and `useInfinitePosts`
4. **Add toggleSidebar to UiStore** — new method + wire to TopNavbar hamburger
5. **Remove "Continue without account" from landing page** — delete ~8 lines, keep "See how it works"
6. **Move notification bell, theme toggle, profile to TopNavbar** — avatar dropdown (settings/logout), consolidate ThemeToggle, remove bottom section from sidebar
7. **Conditional Explore link in sidebar** — only render when `!workspaceId` (dashboard `/w`)

### Out of Scope
- Post deletion endpoints — explored but deferred (Phase 17 permissions tie-in)
- VIEWER role middleware unification — separate concern from public board interaction

## Capabilities

### New Capabilities
None — all changes are component-level fixes within existing capabilities.

### Modified Capabilities
- `public-board-detail`: PublicBoardView gains interactive controls gated by access level
- `authenticated-layout`: Sidebar bottom section replaced by TopNavbar avatar dropdown

## Approach

**Quick Wins First (items 1, 3, 4, 5, 7)**: Each is a ≤10-line single-file fix. Ship together as batch 1.

**Component Refactors (items 2, 6)**: Each touches multiple components:
- Item 2: Replace local `PostRow` with full `PostRow` component, add vote/comment hooks, gate all actions on `publicAccessLevel` + auth state
- Item 6: Add avatar dropdown to `TopNavbar`, move `PendingInvitationsBell`, remove ThemeToggle+profile from sidebar

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web/src/public/public-workspace-view.tsx` | Modified | BoardCard `to` + `board.slug` |
| `web/src/public/public-board-view.tsx` | Modified | Add interactive controls gated by access level |
| `web/src/hooks/use-posts.ts` | Modified | Fix invalidation query key prefix |
| `web/src/core/store/ui-store.ts` | Modified | Add `toggleSidebar` |
| `web/src/shared/components/landing-page.tsx` | Modified | Remove duplicate CTA |
| `web/src/auth/top-navbar.tsx` | Modified | Avatar dropdown + notification bell |
| `web/src/boards/components/sidebar.tsx` | Modified | Remove bottom section, conditional Explore link |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| PublicBoardView interaction controls leak write access | Low | Gate all actions on `publicAccessLevel`; server already enforces |
| Avatar dropdown regresses keyboard navigation | Low | Use existing dropdown pattern from notification bell |
| Query key fix over-invalidates unrelated posts queries | Low | 2-element prefix `['posts', boardId]` only matches board-scoped queries |

## Rollback Plan

All changes are component-level file edits. Revert any file individually — no data dependencies.

## Dependencies

- Phase 15 public workspace infrastructure (access levels, public endpoints)
- Phase 16-B public board detail route (`/explore/:slug/:boardSlug`)

## Success Criteria

- [ ] Clicking a BoardCard in public workspace navigates to `/explore/:slug/:boardSlug`
- [ ] Public board shows vote buttons, comment form, and create-post button based on access level
- [ ] Creating a post immediately shows it in the list without manual refresh
- [ ] Hamburger button toggles sidebar open/closed on desktop
- [ ] Landing page has exactly one CTA button ("See how it works")
- [ ] TopNavbar shows avatar dropdown with Settings + Sign out, plus notification bell
- [ ] Sidebar Explore link only visible on `/w` dashboard
- [ ] All existing 376 tests pass; no lint errors
