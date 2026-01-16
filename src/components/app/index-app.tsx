import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/features/image-uploader";
import { ResultsPanel } from "@/components/features/results-panel";
import { GridCorner } from "@/components/layout/grid-corner";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { type AnalysisResult, analyzeImage } from "@/lib/color/extractor";
import { BORDER_PATTERN_BACKGROUND } from "@/lib/utils/pattern";

export default function IndexApp() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format", {
        description: "Please upload an image file (PNG, JPG, WEBP, GIF).",
      });
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const analysisResult = await analyzeImage(file);
      setResult(analysisResult);
      toast.success("Analysis complete!", {
        description: `Found ${analysisResult.totalColors} OKLCH colors.`,
      });
    } catch {
      setError("Failed to analyze image. Please try with another image.");
      toast.error("Failed to analyze image", {
        description: "Please try with another image.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full">
      <Toaster />
      <div className="flex w-full flex-col py-12">
        <div className="flex items-center justify-between border-t border-b px-6 py-8">
          <h1 className="font-serif text-2xl">
            OKLCH<span className="text-primary">.gen</span>
          </h1>
          {(result || error) && (
            <div className="justify-self-end">
              <Button
                className="gap-2 hover:bg-secondary"
                onClick={reset}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
                {error ? "Try Again" : "New Analysis"}
              </Button>
            </div>
          )}
        </div>

        <div
          className="h-8 w-full overflow-hidden"
          style={{ backgroundImage: BORDER_PATTERN_BACKGROUND }}
        />

        <div className="relative before:absolute before:top-0 before:left-1/2 before:h-px before:w-screen before:-translate-x-1/2 before:bg-border after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-screen after:-translate-x-1/2 after:bg-border">
          <div className="relative px-6 py-12">
            <GridCorner
              className="hidden md:block"
              color="primary"
              position="tl"
            />
            <GridCorner
              className="hidden md:block"
              color="primary"
              position="tr"
            />
            <GridCorner
              className="hidden md:block"
              color="primary"
              position="bl"
            />
            <GridCorner
              className="hidden md:block"
              color="primary"
              position="br"
            />
            <ImageUploader
              error={error}
              isAnalyzing={isAnalyzing}
              onImageSelect={selectImage}
              previewUrl={previewUrl}
            />
          </div>
        </div>

        <div
          className="h-8 w-full overflow-hidden"
          style={{ backgroundImage: BORDER_PATTERN_BACKGROUND }}
        />

        {!result && (
          <div className="border-t border-b px-6 py-3 text-center text-muted-foreground text-xs">
            <div className="mx-auto flex items-center justify-center gap-2">
              <span>
                100% browser-based — your images never leave your device.{" "}
                <span className="font-medium text-foreground">
                  No AI, no server uploads.
                </span>
              </span>
            </div>
          </div>
        )}

        {result && <ResultsPanel result={result} />}
      </div>
    </div>
  );
}
