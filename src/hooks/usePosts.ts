"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { authFetch } from "@/lib/api";
import { asWirePage, toPostRow } from "@/lib/post-contract";
import { ApiError, FRESH_FOR, queryFetch, queryKeys } from "@/lib/query";
import type { PostRow } from "@/types/types";

// A traversal has to terminate on its own even if the server keeps offering a
// cursor. 200 pages is far past any real archive and short of a hang.
const MAX_PAGES = 200;

interface UsePostsReturn {
  posts: PostRow[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  deletePost: (id: string) => Promise<boolean>;
}

// The Hub's table filters and sorts in the browser, so it wants the Creator's
// whole archive — as bounded pages that carry no Post bodies.
async function fetchAllPostRows(): Promise<PostRow[]> {
  const rows: PostRow[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const { items, nextCursor } = asWirePage(
      await queryFetch<unknown>(`/api/posts${query}`),
    );
    rows.push(...items.map(toPostRow));
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return rows;
}

/**
 * Everything a change to a Post makes stale. Declared once so no screen has to
 * coordinate with another: publishing a Draft updates the Posts list and the
 * analytics that summarise it, wherever either happens to be showing.
 */
export function invalidatePostData(client: QueryClient): Promise<void> {
  return Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.posts }),
    client.invalidateQueries({ queryKey: queryKeys.analytics }),
  ]).then(() => undefined);
}

/** For screens outside the Hub shell — the editor — that change a Post. */
export function useInvalidatePostData(): () => Promise<void> {
  const client = useQueryClient();
  return () => invalidatePostData(client);
}

export function usePosts(): UsePostsReturn {
  const client = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.postsList(),
    queryFn: fetchAllPostRows,
    staleTime: FRESH_FOR.posts,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new ApiError(res.status, "Failed to delete post");
      }
    },
    onSuccess: () => invalidatePostData(client),
  });

  return {
    posts: query.data ?? [],
    isLoading: query.isPending,
    error: query.error ? "Failed to fetch posts" : null,
    refresh: async () => {
      await query.refetch();
    },
    deletePost: async (id: string) => {
      try {
        await remove.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
  };
}
