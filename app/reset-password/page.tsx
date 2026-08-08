"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { resetPasswordRequest } from "@/lib/api";
import { passwordMeetsPolicy } from "@/lib/password";
import { SERVICE_UNAVAILABLE } from "@/lib/auth-validation";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthResult } from "@/components/auth/AuthResult";
import { AuthFormAlert, type AuthBanner } from "@/components/auth/AuthFormAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";

function ResetPasswordInner() {
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [banner, setBanner] = useState<AuthBanner | null>(null);
  const fields = useFieldErrors<"password" | "confirm">();

  if (!token) {
    return (
      <AuthShell
        heading="This reset link is not valid"
        sub="The link is missing its token, or it has already been used. Request a new one to continue."
        footNote="Remembered it?"
        footLinkLabel="Back to sign in"
        footLinkHref="/login"
      >
        <AuthResult ctaLabel="Request new link" ctaHref="/forgot-password" />
      </AuthShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    const valid = fields.raise({
      password: passwordMeetsPolicy(password)
        ? undefined
        : "Password must meet all requirements",
      confirm: password === confirm ? undefined : "Passwords do not match",
    });
    if (!valid) return;

    setLoading(true);
    try {
      const res = await resetPasswordRequest(token, password);
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || data.details?.[0]?.message || "Reset failed";
        setBanner({ tone: "error", text: msg });
        toast.error(msg);
        return;
      }
      toast.success("Password reset successfully");
      setUpdated(true);
    } catch {
      setBanner({ tone: "neutral", text: SERVICE_UNAVAILABLE });
      toast.error(SERVICE_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  };

  if (updated) {
    return (
      <AuthShell
        heading="Password updated"
        sub="You can sign in with your new password now."
      >
        <AuthResult ctaLabel="Continue to sign in" ctaHref="/login" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading="Choose a new password"
      sub="Pick something you have not used before."
      footNote="Changed your mind?"
      footLinkLabel="Back to sign in"
      footLinkHref="/login"
    >
      <AuthFormAlert hasFieldErrors={fields.hasErrors} banner={banner} />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-7 flex flex-col gap-4"
      >
        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            if (passwordMeetsPolicy(value)) fields.clear("password");
            // The mismatch belongs to the pair, so either side can resolve it.
            if (value === confirm) fields.clear("confirm");
          }}
          autoComplete="new-password"
          error={fields.errors.password}
          data-testid="reset-password"
        >
          <PasswordStrength password={password} />
        </PasswordField>

        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={(value) => {
            setConfirm(value);
            if (value === password) fields.clear("confirm");
          }}
          autoComplete="new-password"
          error={fields.errors.confirm}
          data-testid="reset-confirm"
        />

        <AuthSubmitButton loading={loading} data-testid="reset-submit">
          Update password
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          checkingSession
          heading="Choose a new password"
          sub="Pick something you have not used before."
        >
          {null}
        </AuthShell>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
