"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmailRequest } from "@/lib/api";

type State = "loading" | "success" | "error";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    if (!token) {
      setState("error");
      setErrorMsg("Missing verification token");
      return;
    }

    (async () => {
      try {
        const res = await verifyEmailRequest(token);
        const data = await res.json();
        if (res.ok) {
          setState("success");
        } else {
          setState("error");
          setErrorMsg(data.error || "Verification failed");
        }
      } catch {
        setState("error");
        setErrorMsg("Unable to reach server");
      }
    })();
  }, [token]);

  if (state === "loading") {
    return (
      <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1 text-center">
        <p className="text-brand-dark font-black uppercase">Verifying...</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1 text-center">
        <h2 className="text-2xl font-black text-brand-dark mb-4">EMAIL VERIFIED ✓</h2>
        <p className="text-brand-dark/80 font-bold text-sm mb-6">
          Your email is confirmed. You can now access all features.
        </p>
        <Link
          href="/dashboard"
          className="block w-full text-center py-3 bg-yellow-400 border-[3px] border-black font-black text-brand-dark shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
        >
          Continue to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] rotate-1 text-center">
      <h2 className="text-2xl font-black text-brand-dark mb-4">VERIFICATION FAILED</h2>
      <p className="text-brand-dark/80 font-bold text-sm mb-6">{errorMsg}</p>
      <Link
        href="/dashboard"
        className="block w-full text-center py-3 bg-yellow-400 border-[3px] border-black font-black text-brand-dark shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 uppercase"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
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
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  );
}
