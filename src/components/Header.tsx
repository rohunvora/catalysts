"use client";

import { formatRelativeTime } from "@/lib/utils";

interface HeaderProps {
  lastUpdated: string;
}

export function Header({ lastUpdated }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background-elevated">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="font-mono font-bold text-lg text-foreground tracking-tight">
                Catalyst Cards
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
                Terminal-Ready Event Feed
              </p>
            </div>
          </div>
          
          {/* Right side: update time + CTA */}
          <div className="flex items-center gap-6">
            {/* Last updated */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
              <span className="text-foreground-muted">
                Updated {formatRelativeTime(lastUpdated)}
              </span>
            </div>
            
            {/* CTA Button */}
            <a
              href="mailto:pilot@catalystcards.io?subject=Catalyst%20Cards%20Pilot%20Interest"
              className="px-4 py-2 bg-accent-primary text-white text-sm font-mono font-medium hover:bg-accent-primary/90 transition-colors"
            >
              Request Pilot Access
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

// Verified tooltip component
export function VerifiedTooltip() {
  return (
    <span 
      className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground-subtle cursor-help border-b border-dashed border-foreground-subtle"
      title="Verified = backed by on-chain tx, official post, or repo commit linked in each card. Not a claim about project legitimacy."
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Verified Insights
    </span>
  );
}

