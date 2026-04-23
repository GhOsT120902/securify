import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, KeyRound, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useQueryClient } from "@tanstack/react-query";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Step = "register" | "verify";

export function SignUpPage() {
  const [, setLocation] = useLocation();
  const { refresh } = useAuthContext();
  const qc = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const emailParam = params.get("email") ?? "";
  const verifyParam = params.get("verify") === "1";

  const [step, setStep] = useState<Step>(verifyParam ? "verify" : "register");
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Registration failed"); return; }
      setStep("verify");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Verification failed"); return; }
      qc.clear();
      await refresh();
      setLocation(`${basePath}/app`);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResent(false);
    try {
      await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
          <div className="bg-primary px-10 py-7 flex items-center gap-3">
            <div className="bg-white/15 p-2 rounded-lg border border-white/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Securify</span>
          </div>

          <div className="p-10">
            {step === "register" ? (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    Create your account
                  </h1>
                  <p className="text-sm text-white/50">Start checking messages for free</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/70">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                      value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/70">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters"
                      className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-white/70">Confirm password</Label>
                  <Input id="confirm" type={showPassword ? "text" : "password"} placeholder="Repeat password"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                {error && (
                  <p className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</> : "Create account"}
                </Button>

                <p className="text-center text-sm text-white/50">
                  Already have an account?{" "}
                  <Link href={`${basePath}/sign-in`} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    Verify your email
                  </h1>
                  <p className="text-sm text-white/50 leading-relaxed">
                    We sent a 6-digit code to <strong className="text-white">{email}</strong>. Enter it below to activate your account.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-white/70">6-digit code</Label>
                  <Input id="otp" type="text" inputMode="numeric" maxLength={6} placeholder="123456"
                    className="text-center text-xl font-bold tracking-[0.4em] font-mono bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required autoFocus />
                </div>

                {error && (
                  <p className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</> : "Verify & sign in"}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-sm text-white/50">
                  {resent ? (
                    <span className="flex items-center gap-1.5 text-primary">
                      <CheckCircle className="h-3.5 w-3.5" /> Code resent!
                    </span>
                  ) : (
                    <>
                      Didn't receive it?{" "}
                      <button type="button" disabled={resending}
                        className="text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
                        onClick={handleResend}>
                        {resending ? "Sending…" : "Resend code"}
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
