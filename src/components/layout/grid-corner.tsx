import { cn } from "@/lib/utils/cn";

interface GridCornerProps {
  position: "tl" | "tr" | "bl" | "br";
  color?: "border" | "primary";
  className?: string;
}

const POSITION_CLASSES = {
  tl: "-top-[5.5px] -left-[6.5px]",
  tr: "-top-[5.5px] -right-[6.5px]",
  bl: "-bottom-[5.5px] -left-[6.5px]",
  br: "-bottom-[5.5px] -right-[6.5px]",
} as const;

export function GridCorner({
  position,
  color = "border",
  className,
}: GridCornerProps) {
  const borderClass = color === "primary" ? "border-primary" : "border-border";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute z-99 flex size-3 items-center justify-center",
        POSITION_CLASSES[position],
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
