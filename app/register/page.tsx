"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { passwordMeetsPolicy } from "@/lib/password";
import { isValidEmail, SERVICE_UNAVAILABLE } from "@/lib/auth-validation";
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthResult } from "@/components/auth/AuthResult";
import { AuthFormAlert, type AuthBanner } from "@/components/auth/AuthFormAlert";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const { checking, serviceError } = useRedirectIfAuthenticated();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [banner, setBanner] = useState<AuthBanner | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const fields = useFieldErrors<"name" | "email" | "password">();

  useEffect(() => {
    if (serviceError) {
      setBanner({ tone: "neutral", text: SERVICE_UNAVAILABLE });
    }
  }, [serviceError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);

    const valid = fields.raise({
      name: name.trim() ? undefined : "Enter your full name",
      email: isValidEmail(email) ? undefined : "Enter a valid email address",
      password: passwordMeetsPolicy(password)
        ? undefined
        : "Password must meet all requirements",
    });
    if (!valid) return;

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.error || data.details?.[0]?.message || "Registration failed";
        setBanner({ tone: "error", text: msg });
        toast.error(msg);
        return;
      }

      toast.success("Account created successfully!");
      setCreated(true);
    } catch (err) {
      console.error("Registration error:", err);
      setBanner({ tone: "neutral", text: SERVICE_UNAVAILABLE });
      toast.error(SERVICE_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <AuthShell
        heading="Account created"
        sub="Welcome to Vision. Your dashboard is ready."
      >
        <AuthResult ctaLabel="Go to dashboard" ctaHref="/dashboard" />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      pending={checking}
      heading="Create your account"
      sub="One account for the editor, the blog and your analytics."
      crossLink={{
        note: "Already have an account?",
        label: "Sign in",
        href: "/login",
      }}
    >
      <AuthFormAlert hasFieldErrors={fields.hasErrors} banner={banner} />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-7 flex flex-col gap-4"
      >
        <Input
          id="name"
          type="text"
          label="Full name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (e.target.value.trim()) fields.clear("name");
          }}
          placeholder="Ada Lovelace"
          autoComplete="name"
          error={fields.errors.name}
          required
        />

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
            if (passwordMeetsPolicy(value)) fields.clear("password");
          }}
          autoComplete="new-password"
          error={fields.errors.password}
        >
          <PasswordStrength password={password} />
        </PasswordField>

        <AuthSubmitButton loading={loading}>Create account</AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
