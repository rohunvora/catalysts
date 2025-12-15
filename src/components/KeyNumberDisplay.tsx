"use client";

import { KeyNumber } from "@/types/catalyst";
import { formatNumber, cn } from "@/lib/utils";

interface KeyNumberDisplayProps {
  keyNumber: KeyNumber;
  size?: "sm" | "md";
}

export function KeyNumberDisplay({ keyNumber, size = "md" }: KeyNumberDisplayProps) {
  const { label, value, unit, delta } = keyNumber;
  
  // Format the value appropriately
  const displayValue = unit === "%" || unit === "x" || unit === "days" || unit === "bps"
    ? value.toLocaleString()
    : formatNumber(value);
  
  return (
    <div className={cn(
      "flex flex-col",
      size === "sm" ? "gap-0" : "gap-0.5"
    )}>
      <span className={cn(
        "font-mono uppercase tracking-wider text-foreground-subtle",
        size === "sm" ? "text-[9px]" : "text-[10px]"
      )}>
        {label}
      </span>
      <span className={cn(
        "font-mono font-medium text-foreground",
        size === "sm" ? "text-xs" : "text-sm"
      )}>
        {displayValue}
        <span className="text-foreground-muted ml-0.5">{unit}</span>
        {delta !== undefined && (
          <span className={cn(
            "ml-1.5",
            delta > 0 ? "text-accent-success" : delta < 0 ? "text-accent-danger" : "text-foreground-muted"
          )}>
            {delta > 0 ? "+" : ""}{delta}%
          </span>
        )}
      </span>
    </div>
  );
}

// Compact inline version for card headers
export function KeyNumberInline({ keyNumber }: { keyNumber: KeyNumber }) {
  const { value, unit } = keyNumber;
  const displayValue = unit === "%" || unit === "x" || unit === "days" || unit === "bps"
    ? value.toLocaleString()
    : formatNumber(value);
    
  return (
    <span className="font-mono text-foreground">
      {displayValue}
      <span className="text-foreground-muted ml-0.5">{unit}</span>
    </span>
  );
}

