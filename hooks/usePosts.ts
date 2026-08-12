import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/api";
import { asWirePage, toPostRow } from "@/lib/post-contract";
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

export function usePosts(): UsePostsReturn {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // The Hub's table filters and sorts in the browser, so it wants the
      // Creator's whole archive — but as bounded pages that carry no Post
      // bodies, rather than one unbounded response with every body in it.
      const rows: PostRow[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
        const res = await authFetch(`/api/posts${query}`);
        if (!res.ok) throw new Error("Failed to fetch posts");

        const { items, nextCursor } = asWirePage(await res.json());
        rows.push(...items.map(toPostRow));
        if (!nextCursor) break;
        cursor = nextCursor;
      }

      setPosts(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePost = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/posts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      
      // Refresh list after deletion
      await fetchPosts();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, error, refresh: fetchPosts, deletePost };
}
