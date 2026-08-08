"use client";

import { useState } from "react";
import { toast } from "sonner";
import { forgotPasswordRequest } from "@/lib/api";
import { isValidEmail, SERVICE_UNAVAILABLE } from "@/lib/auth-validation";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthResult } from "@/components/auth/AuthResult";
import { AuthFormAlert, type AuthBanner } from "@/components/auth/AuthFormAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [banner, setBanner] = useState<AuthBanner | null>(null);
  const fields = useFieldErrors<"email">();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    const valid = fields.raise({
      email: isValidEmail(email) ? undefined : "Enter a valid email address",
    });
    if (!valid) return;

    setLoading(true);
    try {
      const res = await forgotPasswordRequest(email);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || "Something went wrong";
        setBanner({ tone: "error", text: msg });
        toast.error(msg);
        return;
      }
      setSent(true);
    } catch {
      setBanner({ tone: "neutral", text: SERVICE_UNAVAILABLE });
      toast.error(SERVICE_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        heading="Check your email"
        sub={`If an account exists for ${email}, a reset link is on its way.`}
        footNote="Nothing arrived?"
        footLinkLabel="Try another address"
        footLinkHref="/forgot-password"
      >
        <AuthResult ctaLabel="Back to sign in" ctaHref="/login" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading="Reset your password"
      sub="Enter your email and we'll send a link that expires in one hour."
      footNote="Remembered it?"
      footLinkLabel="Back to sign in"
      footLinkHref="/login"
    >
      <AuthFormAlert hasFieldErrors={fields.hasErrors} banner={banner} />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-7 flex flex-col gap-4"
      >
        <Input
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (isValidEmail(e.target.value)) fields.clear("email");
          }}
          placeholder="you@example.com"
          autoComplete="email"
          error={fields.errors.email}
          data-testid="forgot-email"
          required
        />

        <AuthSubmitButton loading={loading} data-testid="forgot-submit">
          Send reset link
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
