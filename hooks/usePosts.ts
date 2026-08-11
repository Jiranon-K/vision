import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/api";
import { asWireList, toPostRow } from "@/lib/post-contract";
import type { PostRow } from "@/types/types";

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
      const res = await authFetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      
      setPosts(asWireList(await res.json()).map(toPostRow));
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
