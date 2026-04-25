"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import Image from "next/image";
import { toast } from "sonner";

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'At least 1 uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'At least 1 lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'At least 1 number', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'At least 1 special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const didAnimate = useRef(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [serviceError, setServiceError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const authPromise = isAuthenticated();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );

        const authed = await Promise.race([authPromise, timeoutPromise]) as boolean;
        
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

      if (!cancelled) {
        setCheckingAuth(false);
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (checkingAuth || serviceError) return;

    const page = pageRef.current;
    if (!page || didAnimate.current) return;

    const timeout = setTimeout(() => {
      didAnimate.current = true;
      animate(".pop-stagger", {
        opacity: [0, 1],
        scale: [0.3, 1],
        rotate: [15, 0],
        duration: 800,
        delay: (el, i) => i * 100,
        easing: "easeOutElastic(1, .5)",
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [checkingAuth, serviceError]);

  const passwordStrength = PASSWORD_REQUIREMENTS.map(req => ({
    ...req,
    met: req.test(password),
  }));

  const allRequirementsMet = passwordStrength.every(r => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allRequirementsMet) {
      setError("Please meet all password requirements");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || data.details?.[0]?.message || "Registration failed";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Account created successfully!");
      router.replace("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setServiceError(true);
      const msg = "Unable to connect to the server. Please try again later.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-cyan-400 flex items-center justify-center overflow-hidden" style={{ backgroundImage: 'radial-gradient(#000 10%, transparent 10%)', backgroundSize: '30px 30px' }}>
        <div className="text-brand-dark font-black text-6xl italic animate-bounce select-none uppercase">JOIN US</div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-cyan-400 flex items-center justify-center p-4 overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(#000 10%, transparent 10%)', backgroundSize: '30px 30px' }}>
      
      <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 border-[3px] border-black rounded-full shadow-[8px_8px_0px_0px_#000] pop-stagger opacity-0 rotate-12 hidden lg:block" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-fuchsia-500 border-[3px] border-black shadow-[8px_8px_0px_0px_#000] pop-stagger opacity-0 -rotate-12 hidden lg:block" />

      <div className="w-full max-w-md relative z-10">
        
        <div className="text-center mb-10 pop-stagger opacity-0">
          <Link href="/" className="inline-block hover:scale-110 transition-transform active:rotate-3">
            <h1 className="text-6xl font-black text-brand-dark bg-white px-6 py-2 border-[4px] border-black shadow-[8px_8px_0px_0px_#000] rotate-2">
              VISION
            </h1>
          </Link>
          <div className="inline-block mt-4 px-4 py-1 bg-yellow-400 text-brand-dark font-black text-sm border-[2px] border-black -rotate-1">
            CREATE NEW ACCOUNT
          </div>
        </div>

        
        <div className="bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_#000] -rotate-1 pop-stagger opacity-0">
          {serviceError ? (
            <div className="text-center py-4">
              <div className="relative w-48 h-48 mx-auto mb-6 border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_#000]">
                <Image
                  src="/images/login-error.png"
                  alt="Connection Error"
                  fill
                  className="object-contain p-2"
                />
              </div>
              <h2 className="text-3xl font-black text-brand-dark mb-2">CRASH!</h2>
              <p className="text-brand-dark/80 mb-6 text-sm font-bold uppercase tracking-tighter">
                OUR SERVERS ARE ON STRIKE.
              </p>
              <button
                onClick={() => {
                  setServiceError(false);
                  setError("");
                }}
                className="w-full py-4 bg-[#D4FF3F] border-[3px] border-black font-black text-brand-dark shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:bg-lime-500 transition-all uppercase"
              >
                TRY AGAIN
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-black text-brand-dark mb-8 underline decoration-fuchsia-500 decoration-4 underline-offset-4 uppercase">GET STARTED</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-100 border-[3px] border-black shadow-[4px_4px_0px_0px_#ef4444] font-black text-red-600 text-sm uppercase">
                  ALERT: {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-[3px] border-black bg-white text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:bg-yellow-50 focus:shadow-[4px_4px_0px_0px_#facc15] transition-all font-bold"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-[3px] border-black bg-white text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:bg-cyan-50 focus:shadow-[4px_4px_0px_0px_#22d3ee] transition-all font-bold"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">
                    Create Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-[3px] border-black bg-white text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:bg-fuchsia-50 focus:shadow-[4px_4px_0px_0px_#d946ef] transition-all font-bold"
                    placeholder="••••••••"
                  />
                  
                  {password && (
                    <div className="mt-4 p-4 bg-brand-dark text-white border-[3px] border-black shadow-[4px_4px_0px_0px_#D4FF3F] rotate-1">
                      <p className="text-[10px] font-black uppercase mb-2 text-brand-lime">Security Checklist:</p>
                      <div className="grid grid-cols-1 gap-1">
                        {passwordStrength.map((req) => (
                          <div
                            key={req.id}
                            className={`text-[10px] font-black flex items-center gap-2 uppercase ${
                              req.met ? 'text-brand-lime' : 'text-white/40'
                            }`}
                          >
                            <span className={`w-3 h-3 border-[1.5px] border-current flex items-center justify-center ${req.met ? 'bg-brand-lime text-brand-dark' : ''}`}>
                              {req.met && '✓'}
                            </span>
                            {req.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-black text-brand-dark mb-2 uppercase italic">
                    Repeat Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-[3px] border-black bg-white text-brand-dark placeholder:text-brand-dark/30 focus:outline-none focus:bg-fuchsia-50 focus:shadow-[4px_4px_0px_0px_#d946ef] transition-all font-bold"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !allRequirementsMet}
                  className="w-full py-4 bg-[#D4FF3F] border-[3px] border-black font-black text-brand-dark text-xl shadow-[8px_8px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:bg-lime-500 transition-all uppercase"
                >
                  {loading ? "CREATING..." : "JOIN NOW →"}
                </button>
              </form>

              <div className="mt-8 text-center border-t-[3px] border-black pt-6">
                <span className="text-brand-dark/60 font-bold uppercase text-xs">Member already?</span>
                <Link
                  href="/login"
                  className="ml-2 text-brand-dark font-black hover:text-cyan-600 transition-colors uppercase text-sm underline underline-offset-2"
                >
                  Sign In here
                </Link>
              </div>
            </>
          )}
        </div>

        
        <div className="text-center mt-10 pop-stagger opacity-0">
          <Link href="/" className="inline-block px-4 py-2 bg-white border-[2px] border-black font-black text-brand-dark/50 hover:text-brand-dark hover:shadow-[4px_4px_0px_0px_#000] transition-all text-sm uppercase">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
