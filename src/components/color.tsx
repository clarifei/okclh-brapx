import { type ColorInfo, getOklchUrl } from "@/lib/color-analysis";
import { cn } from "@/lib/utils";

interface ColorProps {
  color: ColorInfo;
}

export function Color({ color }: ColorProps) {
  const oklchUrl = getOklchUrl(color.oklch);

  return (
    <a
      aria-label={`Open ${color.hex.toUpperCase()} in oklch.com`}
      className={cn(
        "block h-full w-full border-r border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        color.isPrimary && "ring-2 ring-primary ring-inset"
      )}
      href={oklchUrl}
      rel="noopener noreferrer"
      style={{ backgroundColor: color.hex }}
      target="_blank"
    >
      <span className="sr-only">
        Open {color.hex.toUpperCase()} in oklch.com
      </span>
    </a>
  );
}
