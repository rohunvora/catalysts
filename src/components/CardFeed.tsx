"use client";

import { CatalystCard as CatalystCardType, ViewMode } from "@/types/catalyst";
import { CardFeedItem } from "./CatalystCard";
import { cn } from "@/lib/utils";

interface CardFeedProps {
  cards: CatalystCardType[];
  mode: ViewMode;
  onSelect?: (card: CatalystCardType) => void;
  selectedId?: string;
}

export function CardFeed({ cards, mode, onSelect, selectedId }: CardFeedProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg 
          className="w-12 h-12 text-foreground-subtle mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-foreground-muted font-mono text-sm">No catalysts match your filters</p>
        <p className="text-foreground-subtle text-xs mt-1">Try adjusting your filter criteria</p>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "space-y-3",
      mode === "compact" && "space-y-2"
    )}>
      {cards.map((card, index) => (
        <div 
          key={card.id} 
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <CardFeedItem
            card={card}
            mode={mode}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        </div>
      ))}
    </div>
  );
}

