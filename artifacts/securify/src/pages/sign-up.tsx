import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, KeyRound, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { GoogleButton } from "@/components/google-button";

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
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-white dark:bg-card rounded-2xl shadow-md overflow-hidden">
          <div className="bg-primary px-10 py-7 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Securify</span>
          </div>

          <div className="p-10">
            {step === "register" ? (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    Create your account
                  </h1>
                  <p className="text-sm text-muted-foreground">Start checking messages for free</p>
                </div>

                <GoogleButton label="Sign up with Google" />

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-9"
                      value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters"
                      className="pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input id="confirm" type={showPassword ? "text" : "password"} placeholder="Repeat password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account…</> : "Create account"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href={`${basePath}/sign-in`} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Sign in
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    Verify your email
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We sent a 6-digit code to <strong className="text-foreground">{email}</strong>. Enter it below to activate your account.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input id="otp" type="text" inputMode="numeric" maxLength={6} placeholder="123456"
                    className="text-center text-xl font-bold tracking-[0.4em] font-mono"
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required autoFocus />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying…</> : "Verify & sign in"}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
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
