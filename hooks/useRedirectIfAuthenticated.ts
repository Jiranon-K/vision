"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { toast } from "sonner";

const AUTH_CHECK_TIMEOUT_MS = 5000;

/**
 * Bounces a Creator who already has a session away from the public auth
 * screens. The timeout matters: `isAuthenticated` hangs rather than rejects
 * when the API is unreachable, and without it the screen would sit on its
 * session-check panel forever.
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [serviceError, setServiceError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), AUTH_CHECK_TIMEOUT_MS)
        );
        const authed = await Promise.race([isAuthenticated(), timeout]);

        if (!cancelled && authed) {
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        console.error("Auth check failed or timed out:", err);
        if (!cancelled) {
          setServiceError(true);
          toast.error("Unable to reach authentication server");
        }
      }

      if (!cancelled) setChecking(false);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { checking, serviceError };
}
