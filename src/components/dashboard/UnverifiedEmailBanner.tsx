"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { resendVerificationRequest } from "@/lib/api";

const DISMISS_KEY = "vision:unverified-banner-dismissed";

interface Props {
  userEmail: string;
}

export default function UnverifiedEmailBanner({ userEmail }: Props) {
  const [dismissed, setDismissed] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const resend = async () => {
    setSending(true);
    try {
      const res = await resendVerificationRequest();
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Verification email sent");
      } else {
        toast.error(data.error || "Could not send verification email");
      }
    } catch {
      toast.error("Unable to reach server");
    } finally {
      setSending(false);
    }
  };

  if (dismissed) return null;

  return (
    <div
      data-testid="unverified-email-banner"
      className="bg-yellow-300 border-b-[3px] border-black px-6 py-3 flex items-center justify-between gap-4"
    >
      <p className="text-brand-dark font-bold text-sm">
        Your email <span className="font-black">{userEmail}</span> is not verified yet. Check your inbox for the verification link.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={resend}
          disabled={sending}
          className="px-3 py-1 bg-white border-[2px] border-black font-black text-brand-dark text-xs uppercase hover:shadow-[3px_3px_0px_0px_#000]"
        >
          {sending ? "SENDING..." : "RESEND"}
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="px-2 py-1 bg-white border-[2px] border-black font-black text-brand-dark text-xs uppercase hover:shadow-[3px_3px_0px_0px_#000]"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
