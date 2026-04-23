import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthContext } from "@/contexts/auth-context";
import { useQueryClient } from "@tanstack/react-query";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SignInPage() {
  const [, setLocation] = useLocation();
  const { refresh } = useAuthContext();
  const qc = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { error?: string; code?: string };
      if (!res.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerification(true);
        } else {
          setError(data.error ?? "Something went wrong");
        }
        return;
      }
      qc.clear();
      await refresh();
      setLocation(`${basePath}/app`);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (needsVerification) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <AuthCard>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your email <strong className="text-foreground">{email}</strong> hasn't been verified yet.{" "}
            Please check your inbox for the verification code.
          </p>
          <Link href={`${basePath}/sign-up?email=${encodeURIComponent(email)}&verify=1`}>
            <Button className="w-full mt-4">Enter verification code</Button>
          </Link>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 gap-4">
      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">Sign in to your Securify account</p>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href={`${basePath}/forgot-password`} className="text-xs text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Your password"
                className="pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href={`${basePath}/sign-up`} className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </form>
      </AuthCard>
    </div>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[440px]">
      <div className="bg-white dark:bg-card rounded-2xl shadow-md overflow-hidden">
        <div className="bg-primary px-10 py-7 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Securify</span>
        </div>
        <div className="p-10">{children}</div>
      </div>
    </div>
  );
}
