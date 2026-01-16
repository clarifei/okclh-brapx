import { AlertCircle, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUPPORTED_FORMATS = ["PNG", "JPG", "WEBP", "GIF"] as const;

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isAnalyzing: boolean;
  previewUrl: string | null;
  error?: string | null;
}

export function ImageUploader({
  onImageSelect,
  isAnalyzing,
  previewUrl,
  error,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (error && previewUrl) {
    return (
      <div className="flex min-h-50 flex-col items-center justify-center gap-4 p-8">
        <div className="flex size-12 items-center justify-center rounded-full border border-destructive/50">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="text-center">
          <p className="font-medium text-destructive">Analysis Failed</p>
          <p className="mt-1 text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (previewUrl) {
    return (
      <div className="relative flex items-center justify-center overflow-hidden">
        <img
          alt="Uploaded preview"
          className="max-h-125 w-auto max-w-full object-contain"
          height={500}
          src={previewUrl}
          width={500}
        />
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground text-sm">
                Analyzing colors...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <input
        accept="image/*"
        className="sr-only"
        onChange={handleFileInput}
        ref={fileInputRef}
        type="file"
      />

      <button
        className={cn(
          "flex min-h-70 w-full cursor-pointer flex-col items-center justify-center gap-4 p-6 transition-colors",
          isDragging && "bg-primary/5"
        )}
        onClick={handleBrowseClick}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        type="button"
      >
        <div
          className={cn(
            buttonVariants({ size: "icon-lg", variant: "outline" }),
            "pointer-events-none rounded-full"
          )}
        >
          {isDragging ? (
            <ImageIcon className="h-6 w-6 text-primary" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        <div className="text-center">
          <p className="font-serif text-lg">
            {isDragging ? "Drop your image here" : "Drag & drop an image"}
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            or click to select a file
          </p>
        </div>

        <div className="flex gap-2">
          {SUPPORTED_FORMATS.map((format) => (
            <span
              className="border px-2 py-0.5 text-muted-foreground text-xs"
              key={format}
            >
              {format}
            </span>
          ))}
        </div>
      </button>
    </div>
  );
}
