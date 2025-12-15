"use client";

import { useState, useMemo } from "react";
import { Header, VerifiedTooltip } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { CardFeed } from "@/components/CardFeed";
import { ViewToggle } from "@/components/ViewToggle";
import { SAMPLE_CATALYSTS } from "@/data/catalysts";
import { TOKENS } from "@/data/tokens";
import { FilterState, ViewMode, CatalystCard } from "@/types/catalyst";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("full");
  const [selectedCard, setSelectedCard] = useState<CatalystCard | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    tokens: [],
    eventTypes: [],
    severities: [],
    timeHorizons: []
  });
  
  // Filter and sort catalysts
  const filteredCatalysts = useMemo(() => {
    let result = [...SAMPLE_CATALYSTS];
    
    // Apply token filter
    if (filters.tokens.length > 0) {
      result = result.filter(c => filters.tokens.includes(c.asset.mint));
    }
    
    // Apply event type filter
    if (filters.eventTypes.length > 0) {
      result = result.filter(c => filters.eventTypes.includes(c.event_type));
    }
    
    // Apply severity filter
    if (filters.severities.length > 0) {
      result = result.filter(c => filters.severities.includes(c.severity));
    }
    
    // Apply time horizon filter
    if (filters.timeHorizons.length > 0) {
      result = result.filter(c => filters.timeHorizons.includes(c.time_horizon));
    }
    
    // Sort by timestamp (most recent first)
    result.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    
    return result;
  }, [filters]);
  
  // Get the most recent timestamp for "last updated"
  const lastUpdated = useMemo(() => {
    if (SAMPLE_CATALYSTS.length === 0) return new Date().toISOString();
    return SAMPLE_CATALYSTS.reduce((latest, card) => {
      return new Date(card.ts) > new Date(latest) ? card.ts : latest;
    }, SAMPLE_CATALYSTS[0].ts);
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <Header lastUpdated={lastUpdated} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Intro section */}
        <div className="mb-6 pb-6 border-b border-border">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-xl font-mono font-bold text-foreground mb-2">
                Solana Catalyst Feed
              </h2>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Source-linked events for Solana tokens: whale flows, LP changes, lockups/unlocks, 
                privilege changes, incidents. Each card answers <em>why now, is it real, can I get trapped, what&apos;s next</em> — 
                with proof.
              </p>
              <div className="mt-3 flex items-center gap-4">
                <VerifiedTooltip />
                <span className="text-[10px] font-mono text-foreground-subtle">
                  {SAMPLE_CATALYSTS.length} catalysts • 5 tokens • Demo data
                </span>
              </div>
            </div>
            
            {/* View controls */}
            <div className="flex items-center gap-4">
              <ViewToggle mode={viewMode} onChange={setViewMode} />
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Filters sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              tokens={TOKENS}
              catalystCount={filteredCatalysts.length}
            />
          </aside>
          
          {/* Card feed */}
          <section>
            <CardFeed
              cards={filteredCatalysts}
              mode={viewMode}
              onSelect={setSelectedCard}
              selectedId={selectedCard?.id}
            />
          </section>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between text-xs font-mono text-foreground-subtle">
            <div className="flex items-center gap-6">
              <span>© 2024 Catalyst Cards</span>
              <a href="/docs" className="hover:text-foreground transition-colors">
                API Docs
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span>Demo Mode</span>
              <span className="w-2 h-2 rounded-full bg-accent-warning animate-pulse" title="Sample data - not live" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
