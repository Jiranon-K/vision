"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { resetPasswordRequest } from "@/lib/api";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1">
        <h2 className="text-2xl font-black text-brand-dark mb-4">MISSING TOKEN</h2>
        <p className="text-brand-dark/80 font-bold text-sm mb-6">
          This reset link is invalid. Request a new one to continue.
        </p>
        <Link
          href="/forgot-password"
          className="block w-full text-center py-3 bg-yellow-400 border-[3px] border-black font-black text-brand-dark shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
        >
          Request new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPasswordRequest(token, password);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || (data.details?.[0]?.message ?? "Reset failed"));
        return;
      }
      toast.success("Password reset successfully");
      router.replace("/login");
    } catch {
      toast.error("Unable to reach server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1">
      <h2 className="text-2xl font-black text-brand-dark mb-6 underline decoration-cyan-400 decoration-4 underline-offset-4">
        SET NEW PASSWORD
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="reset-password"
            className="w-full px-4 py-4 border-[3px] border-black bg-white text-brand-dark focus:outline-none focus:bg-cyan-50 focus:shadow-[4px_4px_0px_0px_#22d3ee] font-bold"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            data-testid="reset-confirm"
            className="w-full px-4 py-4 border-[3px] border-black bg-white text-brand-dark focus:outline-none focus:bg-fuchsia-50 focus:shadow-[4px_4px_0px_0px_#d946ef] font-bold"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          data-testid="reset-submit"
          className="w-full py-4 bg-yellow-400 border-[3px] border-black font-black text-brand-dark text-xl shadow-[8px_8px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
        >
          {loading ? "SAVING..." : "RESET PASSWORD →"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen bg-[#D4FF3F] flex items-center justify-center p-4"
      style={{ backgroundImage: "radial-gradient(#000 10%, transparent 10%)", backgroundSize: "30px 30px" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-5xl font-black text-brand-dark bg-white px-6 py-2 border-[4px] border-black shadow-[8px_8px_0px_0px_#000] -rotate-2">
              VISION
            </h1>
          </Link>
        </div>
        <Suspense fallback={<div className="text-brand-dark font-black">Loading...</div>}>
          <ResetPasswordInner />
        </Suspense>
      </div>
    </div>
  );
}
