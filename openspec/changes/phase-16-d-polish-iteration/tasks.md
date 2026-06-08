# Tasks: Phase 16-D — Polish Iteration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 260–340 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Quick wins + PublicBoardView interactive + TopNavbar/Sidebar | Single PR | All frontend, no schema, independent files. Minor test additions push toward 340 but under 400. |

## Phase 1: Quick Wins (Items 1, 3, 4, 5)

- [x] 1.1 [RED] **BoardCard link test** — `public-workspace-view.tsx`: write test asserting `href` contains `/explore/{slug}/{board.slug}`
- [x] 1.2 [GREEN] **Fix BoardCard href** — `public-workspace-view.tsx` line 15: change `to={`/explore/${workspaceSlug}`}` → `to={`/explore/${workspaceSlug}/${board.slug}`}`
- [x] 1.3 [RED] **Post invalidation test** — `use-posts.ts`: write test asserting `invalidateQueries` called with `['posts', boardId]`
- [x] 1.4 [GREEN] **Fix post invalidation key** — `useCreatePost` onSuccess: change to `queryClient.invalidateQueries({ queryKey: ['posts', variables.boardId] })`
- [x] 1.5 [RED] **toggleSidebar test** — write test for UiStore: toggleSidebar flips `sidebarOpen` on each call
- [x] 1.6 [GREEN] **Add toggleSidebar** — `ui-store.ts`: add `toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))` + `authenticated-layout.tsx`: use `toggleSidebar` (not `openSidebar`) in `TopNavbar`
- [x] 1.7 [RED] **Update landing test** — remove "Continue without account" assertion, add "exactly one CTA to /explore" test
- [x] 1.8 [GREEN] **Remove duplicate CTA** — `landing-page.tsx`: delete lines 71–79 ("Continue without account" button), verify single CTA renders

## Phase 2: PublicBoardView Interactive (Item 2)

- [x] 2.1 [RED] **Access level gate tests** — `public-board-view.test.tsx`: write tests for all 5 scenarios (anonymous/READ_ONLY/INTERACT/FULL + error path) per spec matrix
- [x] 2.2 [GREEN] **Create PublicPostRow** — new component with `PublicPostRowProps`: vote button (via `useVote`), comment section (via `CommentSection`), conditional create-post; gate all controls on `accessLevel × isAuthenticated` per matrix
- [x] 2.3 [GREEN] **Wire workspace accessLevel** — `PublicBoardView`: parallel fetch `slug` → `publicApi.getWorkspaceBySlug()` for `publicAccessLevel`; replace local `PostRow` with `PublicPostRow`; pass `accessLevel`, `isAuthenticated`, `workspaceSlug`, `boardId`

## Phase 3: TopNavbar + Sidebar (Items 6, 7)

- [x] 3.1 [RED] **TopNavbar test** — write test: avatar renders initials, dropdown has Settings + Sign out with ConfirmDialog; PendingInvitationsBell is present
- [x] 3.2 [GREEN] **TopNavbar avatar dropdown** — replace right-side Settings link + Logout button + user label with: `PendingInvitationsBell`, `ThemeToggle`, initials avatar button + dropdown (Settings → `/settings`, Sign out → existing `ConfirmDialog`)
- [x] 3.3 [RED] **Sidebar Explore conditional test** — write test: Explore visible when `workspaceId=""`, hidden when `workspaceId="abc"`
- [x] 3.4 [GREEN] **Sidebar cleanup** — remove bottom section (lines 227–246: ThemeToggle, PendingInvitationsBell, user card); remove their imports; wrap Explore link in `{!workspaceId && (...)}`

## Phase 4: Verification

- [x] 4.1 Run `pnpm --filter @echolog/web run test` — all tests GREEN, no regressions
- [x] 4.2 Run `pnpm run lint && pnpm run format` — zero errors on changed files
- [x] 4.3 Verify proposal success criteria: all 7 items meet spec scenarios
