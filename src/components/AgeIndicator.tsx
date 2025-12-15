"use client";

import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AgeIndicatorProps {
  timestamp: string;
  firstSeen?: string;
  updatedAt?: string;
  size?: "sm" | "md";
}

export function AgeIndicator({ timestamp, firstSeen, updatedAt, size = "md" }: AgeIndicatorProps) {
  const age = formatRelativeTime(timestamp);
  const wasUpdated = updatedAt && updatedAt !== firstSeen;
  
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-foreground-subtle",
        size === "sm" ? "text-[10px]" : "text-xs",
      )}
      title={`Event: ${new Date(timestamp).toLocaleString()}${wasUpdated ? `\nUpdated: ${new Date(updatedAt).toLocaleString()}` : ''}`}
    >
      <svg 
        className={cn("mr-1", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      {age}
      {wasUpdated && (
        <span className="ml-1 text-accent-warning" title="Updated since first detection">
          •
        </span>
      )}
    </span>
  );
}

