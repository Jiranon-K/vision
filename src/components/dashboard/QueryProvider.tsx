"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ApiError, retryPolicy } from "@/lib/query";

// Several requests can be in flight when a session expires, and each one comes
// back refused. Without this the Creator would be redirected once per request.
let redirecting = false;

export default function QueryProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();

  // Created in state, not at module scope: a client shared across renders is
  // right, one shared across users on a server render is not.
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          // Session expiry is answered once, here, rather than by each hook
          // deciding for itself what an unauthenticated response means. The
          // credential client has already tried its refresh by this point, so
          // a 401 reaching here means the session is genuinely over.
          onError: (error) => {
            if (!(error instanceof ApiError) || error.status !== 401) return;
            if (redirecting) return;
            redirecting = true;
            router.replace("/login");
          },
        }),
        defaultOptions: {
          queries: {
            retry: retryPolicy,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
            // Cached data renders immediately and revalidates behind it, so
            // returning to a screen does not feel like reloading it.
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchOnReconnect: true,
          },
          mutations: { retry: false },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
