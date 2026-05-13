import type { InfiniteData } from '@tanstack/react-query';
import type { PostListResponse } from '../../../../shared/contracts/index.js';

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

export type PostsCacheEntry =
  | PostRowData[]
  | PostListResponse
  | InfiniteData<PostListResponse>;

/**
 * Shape-aware cache updater that handles three query data shapes:
 * - PostRowData[] (direct array of mapped rows)
 * - PostListResponse (single paginated page from useQuery)
 * - InfiniteData<PostListResponse> (multi-page data from useInfiniteQuery)
 */
export function updatePostsCache(
  old: PostsCacheEntry | undefined,
  updater: (post: PostRowData) => PostRowData,
): PostsCacheEntry | undefined {
  if (!old) return old;

  if (Array.isArray(old)) {
    return old.map(updater);
  }

  // InfiniteData<PostListResponse> from useInfiniteQuery —
  // checked before PostListResponse since InfiniteData also has .pages.
  if ('pages' in old && Array.isArray(old.pages)) {
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        posts: page.posts.map(updater),
      })),
    };
  }

  // PostListResponse (single-page response with .posts)
  return {
    ...old,
    posts: old.posts.map(updater),
  };
}
