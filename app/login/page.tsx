"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { setRememberMe, getRememberMe } from "@/lib/auth";
import {
  isValidEmail,
  SERVICE_UNAVAILABLE,
} from "@/lib/auth-validation";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthResult } from "@/components/auth/AuthResult";
import { AuthFormAlert, type AuthBanner } from "@/components/auth/AuthFormAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { checking, serviceError } = useRedirectIfAuthenticated();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMeState] = useState(false);
  const [banner, setBanner] = useState<AuthBanner | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const fields = useFieldErrors<"email" | "password">();

  useEffect(() => {
    setRememberMeState(getRememberMe());
  }, []);

  useEffect(() => {
    if (serviceError) {
      setBanner({ tone: "neutral", text: SERVICE_UNAVAILABLE });
    }
  }, [serviceError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    const valid = fields.raise({
      email: isValidEmail(email) ? undefined : "Enter a valid email address",
      password: password ? undefined : "Enter your password",
    });
    if (!valid) return;

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          res.status === 423
            ? "Account temporarily locked. Please try again later."
            : data.error || "That email and password do not match.";
        setBanner({ tone: "error", text: msg });
        toast.error(msg);
        return;
      }

      setRememberMe(rememberMe);
      toast.success("Welcome back!");
      setSignedIn(true);
    } catch (err) {
      console.error("Login error:", err);
      setBanner({ tone: "neutral", text: SERVICE_UNAVAILABLE });
      toast.error(SERVICE_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  };

  if (signedIn) {
    return (
      <AuthShell
        heading="Signed in"
        sub="Welcome back. Taking you to the dashboard."
      >
        <AuthResult ctaLabel="Go to dashboard" ctaHref="/dashboard" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      checkingSession={checking}
      heading="Sign in"
      sub="Welcome back. Pick up where you left off."
      footNote="New to Vision?"
      footLinkLabel="Create an account"
      footLinkHref="/register"
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
          required
        />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            if (value) fields.clear("password");
          }}
          autoComplete="current-password"
          error={fields.errors.password}
        />

        <div className="flex items-center justify-between gap-3">
          <Checkbox
            id="rememberMe"
            label="Remember me"
            checked={rememberMe}
            onChange={(e) => setRememberMeState(e.target.checked)}
          />
          <Link
            href="/forgot-password"
            className="shrink-0 text-[13.5px] text-text-muted hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>

        <AuthSubmitButton loading={loading}>Sign in</AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
