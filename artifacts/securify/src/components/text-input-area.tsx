import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScanText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextInputAreaProps {
  onAnalyze: (text: string) => void;
  disabled?: boolean;
}

export function TextInputArea({ onAnalyze, disabled }: TextInputAreaProps) {
  const [text, setText] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAnalyze(trimmed);
  }, [text, onAnalyze]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const clear = useCallback(() => setText(""), []);
  const charCount = text.trim().length;

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <textarea
          className={cn(
            "w-full min-h-[180px] resize-none rounded-xl border border-border/60 bg-card px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all duration-200 pr-9",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          placeholder="Paste the SMS message text here — e.g. 'Your package is waiting, click here to confirm delivery…'"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          data-testid="textarea-text-input"
          aria-label="Message text for analysis"
        />
        {text && !disabled && (
          <button
            className="absolute top-3 right-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            onClick={clear}
            type="button"
            aria-label="Clear text"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {charCount > 0 ? (
            <>{charCount} character{charCount !== 1 ? "s" : ""}</>
          ) : (
            <span className="opacity-60">Press Ctrl+Enter to analyze</span>
          )}
        </span>

        <Button
          onClick={handleSubmit}
          disabled={disabled || charCount === 0}
          className="gap-2"
          data-testid="button-analyze-text"
        >
          <ScanText className="h-4 w-4" />
          Analyze Text
        </Button>
      </div>
    </div>
  );
}
