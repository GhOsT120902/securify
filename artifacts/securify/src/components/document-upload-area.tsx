import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/msword": "DOC",
};
const MAX_SIZE_MB = 10;

interface DocumentUploadAreaProps {
  onAnalyze: (fileBase64: string, mimeType: string, fileName: string) => void;
  disabled?: boolean;
}

export function DocumentUploadArea({ onAnalyze, disabled }: DocumentUploadAreaProps) {
  const [file, setFile] = useState<{ name: string; mimeType: string; base64: string; sizeKb: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((f: File) => {
    setError(null);
    if (!ACCEPTED_TYPES[f.type]) {
      setError("Only PDF, DOC, and DOCX files are supported.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(",")[1] ?? "";
      setFile({ name: f.name, mimeType: f.type, base64, sizeKb: Math.round(f.size / 1024) });
    };
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) processFile(picked);
    e.target.value = "";
  }, [processFile]);

  const handleSubmit = () => {
    if (!file) return;
    onAnalyze(file.base64, file.mimeType, file.name);
  };

  return (
    <div className="space-y-3">
      {!file ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer select-none",
            dragOver ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50 hover:bg-muted/30",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Drop your document here, or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX — up to {MAX_SIZE_MB} MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{ACCEPTED_TYPES[file.mimeType]} · {file.sizeKb} KB</p>
          </div>
          {!disabled && (
            <button
              onClick={() => setFile(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        We'll extract the text from your document and run it through our AI scam-detection pipeline.
      </p>

      <Button
        onClick={handleSubmit}
        disabled={disabled || !file}
        className="w-full gap-2"
      >
        {disabled ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Analyzing document…</>
        ) : (
          <><FileText className="h-4 w-4" />Analyze Document</>
        )}
      </Button>
    </div>
  );
}
