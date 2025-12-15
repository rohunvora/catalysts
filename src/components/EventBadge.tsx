"use client";

import { EventType, EVENT_TYPE_META } from "@/types/catalyst";
import { cn } from "@/lib/utils";

interface EventBadgeProps {
  eventType: EventType;
  size?: "sm" | "md";
  showTooltip?: boolean;
}

export function EventBadge({ eventType, size = "md", showTooltip = true }: EventBadgeProps) {
  const meta = EVENT_TYPE_META[eventType];
  
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono uppercase tracking-wider",
        "border border-current/30",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
      )}
      style={{ 
        color: meta.color,
        backgroundColor: `color-mix(in srgb, ${meta.color} 10%, transparent)`
      }}
      title={showTooltip ? meta.description : undefined}
    >
      {meta.label}
    </span>
  );
}

