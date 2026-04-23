import { useEffect, useRef, useState } from "react";
import { Shield, ScanSearch, History, Globe, ArrowRight, ShieldAlert, ShieldCheck, Briefcase, TrendingUp, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "wouter";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

interface RevealItemProps {
  children: React.ReactNode;
  delay?: number;
  inView: boolean;
  className?: string;
}

function RevealItem({ children, delay = 0, inView, className = "" }: RevealItemProps) {
  return (
    <div
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "scale(1) translateY(0)" : "scale(0.88) translateY(28px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function Landing() {
  const featuresReveal = useInView();
  const examplesReveal = useInView();
  const scamsReveal = useInView();

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
          <div className="flex items-center gap-2">
            <ThemeToggle />
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
          <div ref={featuresReveal.ref} className="container mx-auto px-4 md:px-8 py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <RevealItem inView={featuresReveal.inView} delay={0}>
                <div className="flex flex-col items-center text-center gap-4 p-6">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <ScanSearch className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">7-Agent Analysis</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Our pipeline extracts text, checks URLs against Google Safe Browsing, analyzes tone, and cross-references known scam patterns.
                  </p>
                </div>
              </RevealItem>
              <RevealItem inView={featuresReveal.inView} delay={100}>
                <div className="flex flex-col items-center text-center gap-4 p-6">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <History className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">Your Personal History</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Every analysis is saved to your account. Build up a private log of everything you've checked, viewable anytime.
                  </p>
                </div>
              </RevealItem>
              <RevealItem inView={featuresReveal.inView} delay={200}>
                <div className="flex flex-col items-center text-center gap-4 p-6">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">Any Language</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Summaries are translated to your language automatically. Whether the message is in English, Spanish, or Mandarin — we've got you.
                  </p>
                </div>
              </RevealItem>
            </div>
          </div>
        </section>

        {/* Example results */}
        <section className="container mx-auto px-4 md:px-8 py-16 md:py-24 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-center mb-10">
            See what our analysis looks like
          </h2>
          <div ref={examplesReveal.ref} className="grid gap-4">
            <RevealItem inView={examplesReveal.inView} delay={0}>
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
            </RevealItem>
            <RevealItem inView={examplesReveal.inView} delay={130}>
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
            </RevealItem>
          </div>
        </section>

        {/* Learn About Scams */}
        <section className="border-t bg-card/50">
          <div className="container mx-auto px-4 md:px-8 py-16 md:py-24 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight mb-3">
                Learn About Scams
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Educate yourself on the most common tactics used to defraud consumers online.
              </p>
            </div>
            <div ref={scamsReveal.ref} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <RevealItem inView={scamsReveal.inView} delay={0}>
                <div className="bg-card border rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="bg-primary/10 p-3 rounded-xl inline-flex mb-5">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">Fake Job Offers</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Scammers asking for registration fees for non-existent jobs.
                  </p>
                </div>
              </RevealItem>
              <RevealItem inView={scamsReveal.inView} delay={100}>
                <div className="bg-card border rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="bg-primary/10 p-3 rounded-xl inline-flex mb-5">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">Phishing</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Fake bank links trying to steal your credentials.
                  </p>
                </div>
              </RevealItem>
              <RevealItem inView={scamsReveal.inView} delay={200}>
                <div className="bg-card border rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="bg-primary/10 p-3 rounded-xl inline-flex mb-5">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">Investment Scams</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    High-return promises via Telegram or WhatsApp.
                  </p>
                </div>
              </RevealItem>
              <RevealItem inView={scamsReveal.inView} delay={300}>
                <div className="bg-card border rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow h-full">
                  <div className="bg-primary/10 p-3 rounded-xl inline-flex mb-5">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">Lottery Scams</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    SMS claims of winning prizes or digital lotteries.
                  </p>
                </div>
              </RevealItem>
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
