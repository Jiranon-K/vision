"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export function useAuth(redirectToLogin = true) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const authed = await isAuthenticated();
      if (!cancelled) {
        setIsAuthed(authed);
        setIsLoading(false);
        if (!authed && redirectToLogin) {
          router.replace("/login");
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router, redirectToLogin]);

  return { isLoading, isAuthed };
}
