import { Shield, ScanSearch, History, Globe, ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Landing() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">Securify</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="gap-1.5">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 md:px-8 py-20 md:py-32 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Shield className="h-3.5 w-3.5" />
            AI-Powered Scam Detection
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-6 leading-tight">
            Is that message a scam?{" "}
            <span className="text-primary">Find out instantly.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Upload a screenshot or paste suspicious text. Our AI agents analyze it in seconds and explain exactly what's going on — in plain language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 text-base px-8">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="text-base px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-card/50">
          <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center text-center gap-4 p-6">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <ScanSearch className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">7-Agent Analysis</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Our pipeline extracts text, checks URLs against Google Safe Browsing, analyzes tone, and cross-references known scam patterns.
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-4 p-6">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">Your Personal History</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Every analysis is saved to your account. Build up a private log of everything you've checked, viewable anytime.
                </p>
              </div>
              <div className="flex flex-col items-center text-center gap-4 p-6">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">Any Language</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Summaries are translated to your language automatically. Whether the message is in English, Spanish, or Mandarin — we've got you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Example results */}
        <section className="container mx-auto px-4 md:px-8 py-16 md:py-24 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-center mb-10">
            See what our analysis looks like
          </h2>
          <div className="grid gap-4">
            <div className="bg-card border rounded-2xl p-5 flex gap-4 items-start shadow-sm">
              <div className="bg-destructive/10 p-2 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">SCAM DETECTED</span>
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">High confidence</span>
                </div>
                <p className="text-sm text-muted-foreground">"Congratulations! You've been selected for a $1,000 Amazon gift card. Click here to claim before it expires in 24 hours."</p>
                <p className="text-xs text-primary mt-2 font-medium">→ Urgency tactics + suspicious link + unsolicited prize — classic phishing.</p>
              </div>
            </div>
            <div className="bg-card border rounded-2xl p-5 flex gap-4 items-start shadow-sm">
              <div className="bg-primary/10 p-2 rounded-lg shrink-0 mt-0.5">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">LOOKS SAFE</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Low risk</span>
                </div>
                <p className="text-sm text-muted-foreground">"Hi, your package has been dispatched and will arrive Thursday. Track it at [official retailer link]."</p>
                <p className="text-xs text-primary mt-2 font-medium">→ No urgency, no requests for personal data, link passes Safe Browsing check.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">Securify</span>
          </div>
          <p>Stay safe online.</p>
        </div>
      </footer>
    </div>
  );
}
