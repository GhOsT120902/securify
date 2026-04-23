import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setSent(true);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
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
            {sent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  Check your email
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  If <strong className="text-foreground">{email}</strong> is registered, a 6-digit code is on its way. Check your inbox and paste the code on the next page.
                </p>
                <Link href={`${basePath}/reset-password?email=${encodeURIComponent(email)}`}>
                  <Button className="w-full mt-2">
                    Enter code
                  </Button>
                </Link>
                <button
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => { setSent(false); setEmail(""); }}
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
                    Forgot password?
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a one-time code.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send reset code"
                  )}
                </Button>

                <div className="text-center">
                  <Link href={`${basePath}/sign-in`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
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
