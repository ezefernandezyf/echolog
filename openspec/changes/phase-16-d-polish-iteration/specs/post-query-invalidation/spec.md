# Delta for Post Query Invalidation

## ADDED Requirements

### Requirement: Post creation invalidates post list query

The system MUST invalidate the board's infinite post list query after a post is successfully created, so the new post appears without a manual refresh.

#### Scenario: User creates a post on a board

- GIVEN a board with id `board-123` displaying a paginated post list
- WHEN the user creates a new post via `useCreatePost`
- THEN the query key prefix `['posts', 'board-123']` MUST be invalidated
- THEN `useInfinitePosts` for board `board-123` MUST refetch and include the new post

#### Scenario: Query key prefix match across filter variants

- GIVEN `useInfinitePosts` uses query key `['posts', 'board-123', {status: undefined, sort: 'trending'}]`
- WHEN `useCreatePost` invalidates with `['posts', 'board-123']` (2-element prefix)
- THEN React Query prefix matching MUST reach the infinite query regardless of its third-element filter object
- THEN no other board's post list is affected

#### Scenario: Post creation fails

- GIVEN a board with an active post list query
- WHEN `useCreatePost` fails with a server error
- THEN the post list query MUST NOT be invalidated
- THEN the existing post list remains unchanged
