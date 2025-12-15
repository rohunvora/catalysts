"use client";

import { Direction, DIRECTION_META } from "@/types/catalyst";
import { cn } from "@/lib/utils";

interface DirectionIndicatorProps {
  direction?: Direction;
  size?: "sm" | "md";
}

export function DirectionIndicator({ direction, size = "md" }: DirectionIndicatorProps) {
  if (!direction) return null;
  
  const meta = DIRECTION_META[direction];
  
  const Icon = () => {
    if (direction === "BULLISH") {
      return (
        <svg className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 14l5-5 5 5H7z" />
        </svg>
      );
    }
    if (direction === "BEARISH") {
      return (
        <svg className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5H7z" />
        </svg>
      );
    }
    return (
      <svg className={cn(size === "sm" ? "w-3 h-3" : "w-4 h-4")} fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 12h14" stroke="currentColor" strokeWidth={2} />
      </svg>
    );
  };
  
  return (
    <span
      className={cn(
        "inline-flex items-center",
        size === "sm" ? "text-[10px]" : "text-xs",
      )}
      style={{ color: meta.color }}
      title={meta.label}
    >
      <Icon />
    </span>
  );
}

