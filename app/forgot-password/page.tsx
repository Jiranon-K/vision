"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { forgotPasswordRequest } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPasswordRequest(email);
      if (!res.ok && res.status !== 200) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Something went wrong");
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("Unable to reach server");
    } finally {
      setLoading(false);
    }
  };

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

        <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1">
          {submitted ? (
            <>
              <h2 className="text-2xl font-black text-brand-dark mb-4">CHECK YOUR EMAIL</h2>
              <p className="text-brand-dark/80 font-bold text-sm">
                If an account exists for <span className="font-black">{email}</span>, a reset link is on its way. The link expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="block mt-6 w-full text-center py-3 bg-yellow-400 border-[3px] border-black font-black text-brand-dark shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
              >
                Back to login
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-brand-dark mb-6 underline decoration-cyan-400 decoration-4 underline-offset-4">
                FORGOT PASSWORD
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="forgot-email"
                    className="w-full px-4 py-4 border-[3px] border-black bg-white text-brand-dark focus:outline-none focus:bg-cyan-50 focus:shadow-[4px_4px_0px_0px_#22d3ee] font-bold"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  data-testid="forgot-submit"
                  className="w-full py-4 bg-yellow-400 border-[3px] border-black font-black text-brand-dark text-xl shadow-[8px_8px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
                >
                  {loading ? "SENDING..." : "SEND RESET LINK →"}
                </button>
              </form>
              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm font-black text-brand-dark hover:text-cyan-600 uppercase">
                  ← Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
