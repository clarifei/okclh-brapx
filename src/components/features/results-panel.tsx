import { ExternalLink, Star } from "lucide-react";
import { DisplayInfoCard } from "@/components/features/display-info";
import { Color } from "@/components/layout/color";
import { type AnalysisResult, getOklchUrl } from "@/lib/color/extractor";
import { BORDER_PATTERN_BACKGROUND } from "@/lib/utils/pattern";

interface ResultsPanelProps {
  result: AnalysisResult;
}

function PatternDivider() {
  return (
    <div
      className="h-8 w-full overflow-hidden"
      style={{ backgroundImage: BORDER_PATTERN_BACKGROUND }}
    />
  );
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const { colors, primaryColor, totalColors, totalPixelsAnalyzed } = result;
  const shownCount = colors.length;

  return (
    <div>
      <div className="border-t border-b px-6 py-4">
        <DisplayInfoCard />
      </div>

      <PatternDivider />

      {primaryColor && (
        <div className="border-t border-b">
          <div className="flex">
            <a
              aria-label={`Open ${primaryColor.hex.toUpperCase()} in oklch.com`}
              className="size-38 shrink-0 border-r"
              href={getOklchUrl(primaryColor.oklch)}
              rel="noopener noreferrer"
              style={{ backgroundColor: primaryColor.hex }}
              target="_blank"
            >
              <span className="sr-only">
                Open {primaryColor.hex.toUpperCase()} in oklch.com
              </span>
            </a>
            <div className="min-w-0 flex-1 px-6 py-5">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-mono text-2xl">
                  {primaryColor.hex.toUpperCase()}
                </p>
                <span className="flex shrink-0 items-center gap-1 border border-primary/50 px-1.5 py-0 text-[10px] text-primary">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  Primary
                </span>
              </div>

              <p className="mt-1 truncate font-mono text-muted-foreground text-sm">
                {primaryColor.oklchString}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-muted-foreground text-xs">
                  {primaryColor.percentage.toFixed(1)}% of image
                </span>
                <a
                  className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                  href={getOklchUrl(primaryColor.oklch)}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open in oklch.com <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <PatternDivider />

      <div className="grid border-t border-b sm:grid-cols-2">
        <div className="border-b px-6 py-5 sm:border-r sm:border-b-0">
          <div className="mb-1 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
            Total OKLCH Colors
          </div>
          <p className="font-serif text-3xl text-primary">{totalColors}</p>
          <p className="mt-1 text-muted-foreground text-xs">
            Accurate colors within sRGB gamut
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="mb-1 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
            Pixels Analyzed
          </div>
          <p className="font-serif text-3xl">
            {totalPixelsAnalyzed.toLocaleString()}
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            Total pixels processed
          </p>
        </div>
      </div>

      <div className="border-b">
        <div className="px-6 py-4">
          <h3 className="font-serif text-lg">Color Palette</h3>
          <p className="text-muted-foreground text-sm">
            Showing top {shownCount} most frequent colors
            {totalColors > shownCount && ` (of ${totalColors} unique)`}, sorted
            by pixel count. Similar shades are grouped together. Click to open
            in oklch.com.
          </p>
        </div>

        {colors.length > 0 ? (
          <div className="px-6 pb-8">
            <div className="grid w-full auto-rows-[3.5rem] grid-cols-[repeat(auto-fill,3.5rem)] justify-center">
              {colors.map((color) => (
                <Color
                  color={color}
                  key={`${color.hex}-${color.oklchString}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="px-6 pb-8 text-center">
            <p className="text-muted-foreground">No colors found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
