import { AlertCircle, Check, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MonitorInfo {
  colorGamut: "srgb" | "p3" | "rec2020";
  colorDepth: number;
  pixelRatio: number;
  hdr: boolean;
  screenWidth: number;
  screenHeight: number;
}

const GAMUT_CONFIG = {
  rec2020: {
    label: "Rec2020 (Wide Gamut)",
    description: "Your monitor supports Rec2020 — the widest color gamut",
    borderColor: "border-orange-500/50",
    textColor: "text-orange-500",
  },
  p3: {
    label: "Display P3",
    description: "Your monitor supports Display P3 — wider than sRGB",
    borderColor: "border-yellow-500/50",
    textColor: "text-yellow-500",
  },
  srgb: {
    label: "sRGB (Standard)",
    description: "Your monitor uses sRGB — the universal web color standard",
    borderColor: "border-primary/50",
    textColor: "text-primary",
  },
} as const;

export function MonitorInfoCard() {
  const [monitor, setMonitor] = useState<MonitorInfo>({
    colorGamut: "srgb",
    colorDepth: 24,
    pixelRatio: 1,
    hdr: false,
    screenWidth: 0,
    screenHeight: 0,
  });

  useEffect(() => {
    const detectMonitor = () => {
      let colorGamut: "srgb" | "p3" | "rec2020" = "srgb";
      if (window.matchMedia("(color-gamut: rec2020)").matches) {
        colorGamut = "rec2020";
      } else if (window.matchMedia("(color-gamut: p3)").matches) {
        colorGamut = "p3";
      }

      setMonitor({
        colorGamut,
        colorDepth: window.screen.colorDepth || 24,
        pixelRatio: window.devicePixelRatio || 1,
        hdr: window.matchMedia("(dynamic-range: high)").matches,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      });
    };

    detectMonitor();
    const mediaQuery = window.matchMedia("(color-gamut: p3)");
    mediaQuery.addEventListener("change", detectMonitor);

    return () => mediaQuery.removeEventListener("change", detectMonitor);
  }, []);

  const config = GAMUT_CONFIG[monitor.colorGamut];

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
                  config.borderColor,
                  config.textColor
                )}
              >
                {monitor.colorGamut === "srgb" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                {config.label}
              </span>
            </TooltipTrigger>
            <TooltipContent>{config.description}</TooltipContent>
          </Tooltip>
          {monitor.hdr && (
            <span className="border border-primary/50 px-2 py-0.5 text-primary text-xs">
              HDR
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
          <span>
            {monitor.screenWidth}×{monitor.screenHeight}
          </span>
          <span>{monitor.colorDepth}-bit</span>
          <span>{monitor.pixelRatio}x pixel ratio</span>
        </div>
      </div>
    </div>
  );
}
