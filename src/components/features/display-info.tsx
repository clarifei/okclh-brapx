import { AlertCircle, Check, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

interface DisplayInfo {
  colorGamut: "srgb" | "p3" | "rec2020";
  colorDepth: number;
  pixelRatio: number;
  hdr: boolean;
  screenWidth: number;
  screenHeight: number;
}

const GAMUT_INFO = {
  rec2020: {
    label: "Rec2020 (Wide Gamut)",
    desc: "Your monitor supports Rec2020 — widest color gamut",
    border: "border-orange-500/50",
    text: "text-orange-500",
  },
  p3: {
    label: "Display P3",
    desc: "Your monitor supports Display P3 — wider than sRGB",
    border: "border-yellow-500/50",
    text: "text-yellow-500",
  },
  srgb: {
    label: "sRGB (Standard)",
    desc: "Your monitor uses sRGB — universal web color standard",
    border: "border-primary/50",
    text: "text-primary",
  },
} as const;

export function DisplayInfoCard() {
  const [display, setDisplay] = useState<DisplayInfo>({
    colorGamut: "srgb",
    colorDepth: 24,
    pixelRatio: 1,
    hdr: false,
    screenWidth: 0,
    screenHeight: 0,
  });

  useEffect(() => {
    const detectGamut = () => {
      let gamut: "srgb" | "p3" | "rec2020" = "srgb";
      if (window.matchMedia("(color-gamut: rec2020)").matches) {
        gamut = "rec2020";
      } else if (window.matchMedia("(color-gamut: p3)").matches) {
        gamut = "p3";
      }

      setDisplay({
        colorGamut: gamut,
        colorDepth: window.screen.colorDepth || 24,
        pixelRatio: window.devicePixelRatio || 1,
        hdr: window.matchMedia("(dynamic-range: high)").matches,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      });
    };

    detectGamut();
    const mediaQuery = window.matchMedia("(color-gamut: p3)");
    mediaQuery.addEventListener("change", detectGamut);

    return () => mediaQuery.removeEventListener("change", detectGamut);
  }, []);

  const info = GAMUT_INFO[display.colorGamut];

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-10 items-center justify-center rounded-full border">
        <Monitor className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Color Profile</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "flex items-center gap-1 border px-2 py-0.5 text-xs",
                  info.border,
                  info.text
                )}
              >
                {display.colorGamut === "srgb" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                {info.label}
              </span>
            </TooltipTrigger>
            <TooltipContent>{info.desc}</TooltipContent>
          </Tooltip>
          {display.hdr && (
            <span className="border border-primary/50 px-2 py-0.5 text-primary text-xs">
              HDR
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
          <span>
            {display.screenWidth}×{display.screenHeight}
          </span>
          <span>{display.colorDepth}-bit</span>
          <span>{display.pixelRatio}x pixel ratio</span>
        </div>
      </div>
    </div>
  );
}
