import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h2>
      <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="w-full border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href={`${basePath}/`}>
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">Securify</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-16 max-w-3xl">
        <Link href={`${basePath}/`}>
          <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </div>
        </Link>

        <div className="space-y-10">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">Last updated: April 2025</p>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            Securify ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, and safeguard your information when you use our scam-detection
            service at <strong className="text-foreground">securify.works</strong>.
          </p>

          <Section title="1. Who We Are">
            <p>
              Securify is an AI-powered scam detection service. Our tool helps users identify phishing
              messages, fraudulent documents, malicious URLs, and other deceptive content. We are not
              a financial institution, law enforcement agency, or cybersecurity firm — we are a consumer
              safety tool.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p><strong className="text-foreground">Account information:</strong> When you register, we collect your email address and a hashed version of your password. We never store your password in plain text.</p>
            <p><strong className="text-foreground">Content you submit:</strong> Screenshots, text messages, document files, and URLs you submit for analysis are processed temporarily to generate your result. This content is not stored after analysis is complete.</p>
            <p><strong className="text-foreground">Usage data:</strong> We may collect anonymised usage data (pages visited, features used) to improve the service. This data cannot identify you personally.</p>
            <p><strong className="text-foreground">Cookies:</strong> We use a session cookie solely to keep you signed in. We do not use advertising or tracking cookies.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Provide and operate the Securify service</li>
              <li>Send transactional emails (verification codes, password resets)</li>
              <li>Improve service quality through anonymised analytics</li>
              <li>Comply with applicable laws and regulations</li>
            </ul>
            <p>We do <strong className="text-foreground">not</strong> sell your data, use it for advertising, or share it with third parties except as described below.</p>
          </Section>

          <Section title="4. Third-Party Services">
            <p>We use the following third-party services to operate Securify:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong className="text-foreground">OpenAI</strong> — AI analysis of submitted content (subject to OpenAI's data policies)</li>
              <li><strong className="text-foreground">Google Safe Browsing API</strong> — URL safety checking</li>
              <li><strong className="text-foreground">Resend</strong> — Transactional email delivery</li>
            </ul>
            <p>Each provider processes only the minimum data required to perform their service and is bound by their own privacy policies.</p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              Your account information is retained for as long as your account is active. Content
              submitted for analysis (screenshots, messages, documents, URLs) is processed in memory
              and <strong className="text-foreground">not persisted to disk or any database</strong> after
              your result is returned.
            </p>
            <p>You may delete your account at any time by contacting us, which will permanently remove your account data.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to processing of your data</li>
            </ul>
            <p>To exercise any of these rights, contact us at <strong className="text-foreground">privacy@securify.works</strong>.</p>
          </Section>

          <Section title="7. Security">
            <p>
              We use industry-standard security measures including HTTPS encryption, hashed passwords,
              and secure session management. No method of transmission over the internet is 100% secure,
              but we take reasonable precautions to protect your information.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              Securify is not directed at children under 13. We do not knowingly collect personal
              information from children. If you believe a child has provided us with personal information,
              please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. If we make significant changes,
              we will notify registered users by email. Continued use of Securify after changes
              constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <p>
              <strong className="text-foreground">Email:</strong> privacy@securify.works<br />
              <strong className="text-foreground">Website:</strong> https://securify.works
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground mt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">Securify</span>
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
