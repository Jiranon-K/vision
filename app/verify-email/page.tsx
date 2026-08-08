"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { verifyEmailRequest, resendVerificationRequest } from "@/lib/api";
import { SERVICE_UNAVAILABLE } from "@/lib/auth-validation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthResult } from "@/components/auth/AuthResult";
import { AuthFormAlert, type AuthBanner } from "@/components/auth/AuthFormAlert";
import { Spinner } from "@/components/ui/spinner";

type Phase = "verifying" | "verified" | "failed";

const CROSS_LINK = {
  note: "Wrong address?",
  label: "Use another email",
  href: "/register",
};

function VerifyEmailInner() {
  const token = useSearchParams().get("token") ?? "";

  const [phase, setPhase] = useState<Phase>(token ? "verifying" : "failed");
  const [banner, setBanner] = useState<AuthBanner | null>(
    token
      ? null
      : {
          tone: "error",
          text: "This link is missing its verification token.",
        }
  );
  const [resending, setResending] = useState(false);
  const didRun = useRef(false);

  useEffect(() => {
    if (!token || didRun.current) return;
    didRun.current = true;

    (async () => {
      try {
        const res = await verifyEmailRequest(token);
        const data = await res.json();
        if (res.ok) {
          setPhase("verified");
          return;
        }
        setPhase("failed");
        setBanner({
          tone: "error",
          text: data.error || "We could not verify this address.",
        });
      } catch {
        setPhase("failed");
        setBanner({ tone: "neutral", text: SERVICE_UNAVAILABLE });
      }
    })();
  }, [token]);

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    try {
      const res = await resendVerificationRequest();
      if (!res.ok) {
        toast.error("Sign in first, then we can resend the verification email.");
        return;
      }
      toast.success("Verification email sent.");
    } catch {
      toast.error(SERVICE_UNAVAILABLE);
    } finally {
      setResending(false);
    }
  };

  const resendLabel = resending ? "Sending…" : "Resend verification email";

  if (phase === "verified") {
    return (
      <AuthShell
        heading="Email verified"
        sub="Your address is confirmed. Everything is unlocked."
      >
        <AuthResult ctaLabel="Continue" ctaHref="/dashboard" />
      </AuthShell>
    );
  }

  if (phase === "verifying") {
    return (
      <AuthShell
        heading="Verify your email"
        sub="Confirming your address — this only takes a moment."
        crossLink={CROSS_LINK}
      >
        <div className="mt-7 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-text-muted">
            <Spinner size="sm" label={null} />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
              Verifying
            </span>
          </div>
          <button
            type="button"
            onClick={handleResend}
            className="w-fit text-[13.5px] text-text-muted hover:text-foreground"
          >
            {resendLabel}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading="Verify your email"
      sub="We could not confirm this address from the link you followed."
      crossLink={CROSS_LINK}
    >
      <AuthFormAlert banner={banner} />

      <AuthResult
        ctaLabel="Back to sign in"
        ctaHref="/login"
        altLabel={resendLabel}
        onAltClick={handleResend}
      />
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          pending
          heading="Verify your email"
          sub="Confirming your address — this only takes a moment."
          crossLink={CROSS_LINK}
        >
          {null}
        </AuthShell>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
