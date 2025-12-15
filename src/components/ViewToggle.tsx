"use client";

import { ViewMode } from "@/types/catalyst";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex border border-border">
      <button
        onClick={() => onChange("compact")}
        className={cn(
          "px-3 py-1.5 text-xs font-mono transition-colors",
          mode === "compact"
            ? "bg-foreground text-background"
            : "text-foreground-muted hover:text-foreground"
        )}
        title="Compact view - more cards visible"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => onChange("full")}
        className={cn(
          "px-3 py-1.5 text-xs font-mono transition-colors border-l border-border",
          mode === "full"
            ? "bg-foreground text-background"
            : "text-foreground-muted hover:text-foreground"
        )}
        title="Full view - all details"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      </button>
    </div>
  );
}

