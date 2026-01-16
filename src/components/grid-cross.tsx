import { cn } from "@/lib/utils";

interface GridCrossProps {
  position: "tl" | "tr" | "bl" | "br";
  color?: "border" | "primary";
  className?: string;
}

const POSITION_CLASSNAMES = {
  tl: "-top-1.25 -left-1.5",
  tr: "-top-1.25 -right-1.5",
  bl: "-bottom-1.25 -left-1.5",
  br: "-bottom-1.25 -right-1.5",
} as const;

export function GridCross({
  position,
  color = "border",
  className,
}: GridCrossProps) {
  const borderClass = color === "primary" ? "border-primary" : "border-border";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-99 flex size-3 items-center justify-center",
        POSITION_CLASSNAMES[position],
        className
      )}
    >
      <div
        className={cn(
          "absolute top-0 left-1/2 h-full w-0 -translate-x-1/2 border-r",
          borderClass
        )}
      />
      <div
        className={cn(
          "absolute top-1/2 left-0 h-0 w-full -translate-y-1/2 border-b",
          borderClass
        )}
      />
    </div>
  );
}
