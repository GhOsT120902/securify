import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, KeyRound, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function ResetPasswordPage() {
  const [location] = useLocation();
  const emailParam = new URLSearchParams(window.location.search).get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Enter the 6-digit code from your email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
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
            {done ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-primary/10 p-4 rounded-full border border-primary/20">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Password updated!
                </h1>
                <p className="text-white/50 text-sm leading-relaxed">
                  Your password has been changed successfully. You can now sign in with your new password.
                </p>
                <Link href={`${basePath}/sign-in`}>
                  <Button className="w-full mt-2">
                    Sign in
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    Set new password
                  </h1>
                  <p className="text-sm text-white/50">
                    Enter the 6-digit code from your email and choose a new password.
                  </p>
                </div>

                {!emailParam && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/70">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-white/70">6-digit code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="text-center text-xl font-bold tracking-[0.4em] font-mono bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    autoFocus={!!emailParam}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white/70">New password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/70">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat new password"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>

                <div className="text-center">
                  <Link href={`${basePath}/forgot-password`} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-primary transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Request a new code
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
