export interface PostRowData {
  id: string;
  title: string;
  description: string;
  status: string;
  upvotes: number;
  comments: number;
  isUpvoted?: boolean;
  author?: string;
  createdAt: string;
  trendScore: number;
}

// The React Query cache stores a mix of server DTOs and mapped row data at runtime.
// We use unknown[] to avoid TS fighting between PostRowData and PostDTO shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostArray = any[];
type PostCachePage = { posts: PostArray };
type PostCacheInfinite = { pages: PostCachePage[] };

export type PostsCacheEntry = PostArray | PostCachePage | PostCacheInfinite;

/**
 * Shape-aware cache updater that handles three query data shapes.
 * All three co-exist under ['posts', ...] keys:
 * - PostArray (direct array, e.g. legacy cache)
 * - PostCachePage (single PostListResponse-like page)
 * - PostCacheInfinite (useInfiniteQuery multi-page data)
 */
export function updatePostsCache(
  old: PostsCacheEntry | undefined,
  updater: (post: PostRowData) => PostRowData,
): PostsCacheEntry | undefined {
  if (!old) return old;

  if (Array.isArray(old)) {
    return old.map(updater);
  }

  // InfiniteData from useInfiniteQuery — has .pages with .posts inside each page
  if ('pages' in old && Array.isArray(old.pages)) {
    return {
      ...old,
      pages: old.pages.map((page: PostCachePage) => ({
        ...page,
        posts: page.posts.map((p) => updater(p as unknown as PostRowData)),
      })),
    };
  }

  // Single-page object with .posts
  const response = old as PostCachePage;
  return {
    ...response,
    posts: response.posts.map((p) => updater(p as unknown as PostRowData)),
  };
}
