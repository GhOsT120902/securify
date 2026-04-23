import { Shield, ScanSearch, Brain, Lock, Users, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AboutPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-black">
      <header className="w-full border-b border-white/8 bg-black/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href={`${basePath}/`}>
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="bg-primary/15 p-2 rounded-lg border border-primary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">Securify</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-16 max-w-3xl">
        <Link href={`${basePath}/`}>
          <div className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-primary transition-colors mb-8 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </div>
        </Link>

        <div className="space-y-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
              About Securify
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Securify is a free, AI-powered scam detection tool built to help everyday people
              protect themselves online. We believe everyone deserves access to smart, instant
              security analysis — without needing a cybersecurity degree.
            </p>
          </div>

          <div className="grid gap-8">
            <div className="flex gap-5">
              <div className="bg-primary/15 p-3 rounded-xl h-fit shrink-0 border border-primary/20">
                <ScanSearch className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  What We Do
                </h2>
                <p className="text-white/60 leading-relaxed">
                  Securify analyses screenshots, SMS messages, documents, and URLs to detect scam
                  patterns. Our system checks for phishing links, fake job offers, investment fraud,
                  lottery scams, and other deceptive content — and gives you a clear, plain-English
                  verdict in seconds.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="bg-primary/15 p-3 rounded-xl h-fit shrink-0 border border-primary/20">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  How It Works
                </h2>
                <p className="text-white/60 leading-relaxed">
                  When you submit content for analysis, it is processed by a multi-agent AI pipeline.
                  Each agent examines a different dimension — link safety, language patterns, sender
                  authenticity, urgency signals, and more — before combining results into a single
                  trust score and detailed report. No data is stored after analysis is complete.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="bg-primary/15 p-3 rounded-xl h-fit shrink-0 border border-primary/20">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  Your Privacy
                </h2>
                <p className="text-white/60 leading-relaxed">
                  We take privacy seriously. Content you submit is used solely to generate your
                  analysis result and is not stored, shared, or used for training. Your account
                  information is encrypted and never sold to third parties.
                  See our <Link href={`${basePath}/privacy`} className="text-primary hover:underline">Privacy Policy</Link> for full details.
                </p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="bg-primary/15 p-3 rounded-xl h-fit shrink-0 border border-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  Who It's For
                </h2>
                <p className="text-white/60 leading-relaxed">
                  Securify is designed for anyone who receives suspicious messages — job seekers who
                  get unsolicited offers, seniors targeted by prize scams, shoppers encountering
                  fake payment requests, or anyone unsure whether a link is safe to click.
                  If something feels off, Securify can help you verify it in seconds.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Stay safe online
            </h2>
            <p className="text-white/50 mb-6">
              Securify is free to use. Create an account to get started.
            </p>
            <Link href={`${basePath}/sign-up`}>
              <button className="bg-primary text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors border border-primary/70">
                Get started free
              </button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/8 py-8 text-center text-sm text-white/40 bg-black">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-bold text-white">Securify</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Link href={`${basePath}/about`} className="hover:text-primary transition-colors">About</Link>
            <Link href={`${basePath}/privacy`} className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
