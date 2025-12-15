"use client";

import { CatalystCard as CatalystCardType, ViewMode } from "@/types/catalyst";
import { cn } from "@/lib/utils";
import { EventBadge } from "./EventBadge";
import { SeverityBadge } from "./SeverityBadge";
import { TimeHorizonBadge } from "./TimeHorizonBadge";
import { DirectionIndicator } from "./DirectionIndicator";
import { AgeIndicator } from "./AgeIndicator";
import { EvidenceLink, SimulatedBadge } from "./EvidenceLink";
import { KeyNumberDisplay, KeyNumberInline } from "./KeyNumberDisplay";
import { JSONPanel } from "./JSONPanel";

interface CatalystCardProps {
  card: CatalystCardType;
  mode: ViewMode;
  onClick?: () => void;
  isSelected?: boolean;
}

export function CatalystCard({ card, mode, onClick, isSelected }: CatalystCardProps) {
  if (mode === "compact") {
    return <CompactCard card={card} onClick={onClick} isSelected={isSelected} />;
  }
  return <FullCard card={card} onClick={onClick} isSelected={isSelected} />;
}

// Compact mode: headline + event badge + 2 numbers + age + 1 proof icon
function CompactCard({ card, onClick, isSelected }: Omit<CatalystCardProps, "mode">) {
  const firstTwoNumbers = card.key_numbers.slice(0, 2);
  const firstEvidence = card.evidence[0];
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 border border-border bg-background-card transition-colors cursor-pointer",
        "hover:bg-background-hover hover:border-foreground-subtle/30",
        isSelected && "border-accent-primary bg-accent-primary/5",
        "animate-fade-in"
      )}
    >
      {/* Top row: badges + age */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-medium text-foreground">
            {card.asset.symbol}
          </span>
          <EventBadge eventType={card.event_type} size="sm" />
          <DirectionIndicator direction={card.direction} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={card.severity} size="sm" />
          <AgeIndicator timestamp={card.ts} size="sm" />
        </div>
      </div>
      
      {/* Headline */}
      <p className="text-sm text-foreground leading-snug mb-2 line-clamp-2">
        {card.headline}
      </p>
      
      {/* Bottom row: numbers + evidence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          {firstTwoNumbers.map((num, i) => (
            <KeyNumberInline key={i} keyNumber={num} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {card.simulated && <SimulatedBadge />}
          {firstEvidence && <EvidenceLink evidence={firstEvidence} compact />}
        </div>
      </div>
    </div>
  );
}

// Full mode: all fields including "so what" bullets + all evidence
function FullCard({ card, onClick, isSelected }: Omit<CatalystCardProps, "mode">) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 border border-border bg-background-card transition-colors",
        "hover:border-foreground-subtle/30",
        isSelected && "border-accent-primary bg-accent-primary/5",
        "animate-fade-in"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-medium text-foreground">
            {card.asset.symbol}
          </span>
          <EventBadge eventType={card.event_type} size="md" />
          <DirectionIndicator direction={card.direction} size="md" />
          {card.simulated && <SimulatedBadge />}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <SeverityBadge severity={card.severity} size="md" />
          <TimeHorizonBadge timeHorizon={card.time_horizon} size="md" />
          <AgeIndicator 
            timestamp={card.ts} 
            firstSeen={card.first_seen}
            updatedAt={card.updated_at}
            size="md" 
          />
        </div>
      </div>
      
      {/* Headline */}
      <h3 className="text-base font-medium text-foreground leading-snug mb-3">
        {card.headline}
      </h3>
      
      {/* Key numbers grid */}
      {card.key_numbers.length > 0 && (
        <div className="flex flex-wrap gap-6 mb-4 pb-4 border-b border-border-subtle">
          {card.key_numbers.map((num, i) => (
            <KeyNumberDisplay key={i} keyNumber={num} size="md" />
          ))}
        </div>
      )}
      
      {/* So what bullets */}
      {card.so_what.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle mb-2 block">
            So What
          </span>
          <ul className="space-y-1.5">
            {card.so_what.map((bullet, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground-muted">
                <span className="text-foreground-subtle select-none">→</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Evidence section */}
      <div className="mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle mb-2 block">
          Evidence ({card.source_count} source{card.source_count !== 1 ? "s" : ""})
        </span>
        <div className="flex flex-wrap gap-3">
          {card.evidence.map((ev, i) => (
            <EvidenceLink key={i} evidence={ev} />
          ))}
        </div>
      </div>
      
      {/* Entities (if any) */}
      {card.entities && card.entities.length > 0 && (
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle mb-2 block">
            Entities
          </span>
          <div className="flex flex-wrap gap-2">
            {card.entities.map((entity, i) => (
              <span 
                key={i}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono bg-background border border-border"
                title={entity.address}
              >
                <span className="text-foreground-subtle capitalize">{entity.type}:</span>
                <span className="text-foreground-muted">{entity.label || entity.address.slice(0, 8) + "..."}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Confidence */}
      <div className="flex items-center gap-4 text-xs font-mono text-foreground-subtle">
        <span>
          Confidence: <span className="text-foreground">{(card.confidence * 100).toFixed(0)}%</span>
        </span>
        {card.calcs && Object.keys(card.calcs).length > 0 && (
          <span className="text-foreground-subtle" title={JSON.stringify(card.calcs)}>
            Calcs available
          </span>
        )}
      </div>
      
      {/* JSON Panel */}
      <JSONPanel card={card} />
    </div>
  );
}

// Card wrapper for the feed
interface CardFeedItemProps {
  card: CatalystCardType;
  mode: ViewMode;
  onSelect?: (card: CatalystCardType) => void;
  selectedId?: string;
}

export function CardFeedItem({ card, mode, onSelect, selectedId }: CardFeedItemProps) {
  return (
    <CatalystCard
      card={card}
      mode={mode}
      onClick={() => onSelect?.(card)}
      isSelected={selectedId === card.id}
    />
  );
}

