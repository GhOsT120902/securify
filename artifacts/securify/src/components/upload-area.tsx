import { useCallback, useState } from "react";
import { UploadCloud, FileImage, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadAreaProps {
  onUpload: (imageBase64: string, mimeType: string) => void;
  disabled?: boolean;
}

export function UploadArea({ onUpload, disabled }: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      
      const base64Data = result.split(',')[1];
      onUpload(base64Data, file.type);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-sm bg-muted/30 p-2">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
            <img src={preview} alt="Upload preview" className="max-h-full max-w-full object-contain" />
          </div>
          <Button 
            variant="secondary" 
            size="icon" 
            className="absolute top-4 right-4 h-8 w-8 rounded-full shadow-md bg-background/80 backdrop-blur-md hover:bg-background"
            onClick={clearPreview}
            disabled={disabled}
            data-testid="button-clear-preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer group bg-card",
            dragActive 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && document.getElementById("file-upload")?.click()}
        >
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
            disabled={disabled}
            data-testid="input-file-upload"
          />
          <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload suspicious message</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Drag and drop a screenshot of a text, email, or post, or click to browse files.
          </p>
          <Button variant="outline" className="pointer-events-none" disabled={disabled}>
            <FileImage className="mr-2 h-4 w-4" />
            Select Image
          </Button>
        </div>
      )}
    </div>
  );
}
