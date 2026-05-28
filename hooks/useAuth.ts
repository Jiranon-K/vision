"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

export function useAuth(redirectToLogin = true) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const currentUser = await getCurrentUser();
      if (!cancelled) {
        setUser(currentUser);
        setIsAuthed(!!currentUser);
        setIsLoading(false);
        if (!currentUser && redirectToLogin) {
          router.replace("/login");
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router, redirectToLogin]);

  return { isLoading, isAuthed, user };
}
