"use client";

import { TimeHorizon, TIME_HORIZON_META } from "@/types/catalyst";
import { cn } from "@/lib/utils";

interface TimeHorizonBadgeProps {
  timeHorizon: TimeHorizon;
  size?: "sm" | "md";
}

export function TimeHorizonBadge({ timeHorizon, size = "md" }: TimeHorizonBadgeProps) {
  const meta = TIME_HORIZON_META[timeHorizon];
  
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono uppercase tracking-wider text-foreground-muted",
        "border border-border",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
      )}
      title={meta.description}
    >
      {meta.label}
    </span>
  );
}

