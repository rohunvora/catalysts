"use client";

import { Severity, SEVERITY_META } from "@/types/catalyst";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: Severity;
  size?: "sm" | "md";
}

export function SeverityBadge({ severity, size = "md" }: SeverityBadgeProps) {
  const meta = SEVERITY_META[severity];
  
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono uppercase tracking-wider",
        size === "sm" ? "text-[10px]" : "text-xs",
      )}
      style={{ color: meta.color }}
      title={`Severity: ${meta.label}`}
    >
      <span 
        className={cn(
          "rounded-full mr-1.5",
          size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2"
        )}
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}

