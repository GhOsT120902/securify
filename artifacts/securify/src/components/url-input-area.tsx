import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Loader2, ShieldCheck } from "lucide-react";

interface UrlInputAreaProps {
  onAnalyze: (url: string) => void;
  disabled?: boolean;
}

export function UrlInputArea({ onAnalyze, disabled }: UrlInputAreaProps) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError("Please enter a URL.");
      return;
    }
    try {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      onAnalyze(parsed.toString());
    } catch {
      setValidationError("That doesn't look like a valid URL. Try including https://");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="space-y-2">
        <div className="relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="https://example-suspicious-site.com/login"
            className="pl-9 h-11 font-mono text-sm"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setValidationError(null); }}
            disabled={disabled}
            autoFocus
          />
        </div>
        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          We'll check against Google Safe Browsing and run AI-powered analysis on the domain and URL structure.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground border rounded-lg p-3 bg-muted/30">
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
          <span>Google Safe Browsing threat database</span>
        </div>
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
          <span>Typosquatting &amp; brand impersonation</span>
        </div>
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
          <span>Suspicious domain &amp; TLD patterns</span>
        </div>
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
          <span>Phishing URL structure analysis</span>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={disabled || !url.trim()}>
        {disabled ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking URL…
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Check this URL
          </>
        )}
      </Button>
    </form>
  );
}
