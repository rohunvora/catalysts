"use client";

import { EventType, Severity, TimeHorizon, FilterState, EVENT_TYPE_META, SEVERITY_META, TIME_HORIZON_META, Token } from "@/types/catalyst";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  tokens: Token[];
  catalystCount: number;
}

export function FilterBar({ filters, onFilterChange, tokens, catalystCount }: FilterBarProps) {
  const eventTypes = Object.keys(EVENT_TYPE_META) as EventType[];
  const severities = Object.keys(SEVERITY_META) as Severity[];
  const timeHorizons = Object.keys(TIME_HORIZON_META) as TimeHorizon[];
  
  const toggleToken = (mint: string) => {
    const newTokens = filters.tokens.includes(mint)
      ? filters.tokens.filter(t => t !== mint)
      : [...filters.tokens, mint];
    onFilterChange({ ...filters, tokens: newTokens });
  };
  
  const toggleEventType = (type: EventType) => {
    const newTypes = filters.eventTypes.includes(type)
      ? filters.eventTypes.filter(t => t !== type)
      : [...filters.eventTypes, type];
    onFilterChange({ ...filters, eventTypes: newTypes });
  };
  
  const toggleSeverity = (sev: Severity) => {
    const newSev = filters.severities.includes(sev)
      ? filters.severities.filter(s => s !== sev)
      : [...filters.severities, sev];
    onFilterChange({ ...filters, severities: newSev });
  };
  
  const toggleTimeHorizon = (th: TimeHorizon) => {
    const newTh = filters.timeHorizons.includes(th)
      ? filters.timeHorizons.filter(t => t !== th)
      : [...filters.timeHorizons, th];
    onFilterChange({ ...filters, timeHorizons: newTh });
  };
  
  const clearAll = () => {
    onFilterChange({
      tokens: [],
      eventTypes: [],
      severities: [],
      timeHorizons: []
    });
  };
  
  const hasFilters = filters.tokens.length > 0 || 
    filters.eventTypes.length > 0 || 
    filters.severities.length > 0 || 
    filters.timeHorizons.length > 0;
  
  return (
    <div className="space-y-3 p-4 border border-border bg-background-elevated">
      {/* Token filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
            Tokens
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tokens.map(token => (
            <FilterChip
              key={token.mint}
              label={token.symbol}
              active={filters.tokens.includes(token.mint)}
              onClick={() => toggleToken(token.mint)}
            />
          ))}
        </div>
      </div>
      
      {/* Event type filter */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle block mb-2">
          Event Type
        </span>
        <div className="flex flex-wrap gap-2">
          {eventTypes.map(type => (
            <FilterChip
              key={type}
              label={EVENT_TYPE_META[type].label}
              active={filters.eventTypes.includes(type)}
              onClick={() => toggleEventType(type)}
              color={EVENT_TYPE_META[type].color}
            />
          ))}
        </div>
      </div>
      
      {/* Severity filter */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle block mb-2">
          Severity
        </span>
        <div className="flex flex-wrap gap-2">
          {severities.map(sev => (
            <FilterChip
              key={sev}
              label={SEVERITY_META[sev].label}
              active={filters.severities.includes(sev)}
              onClick={() => toggleSeverity(sev)}
              color={SEVERITY_META[sev].color}
            />
          ))}
        </div>
      </div>
      
      {/* Time horizon filter */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle block mb-2">
          Time Horizon
        </span>
        <div className="flex flex-wrap gap-2">
          {timeHorizons.map(th => (
            <FilterChip
              key={th}
              label={TIME_HORIZON_META[th].label}
              active={filters.timeHorizons.includes(th)}
              onClick={() => toggleTimeHorizon(th)}
            />
          ))}
        </div>
      </div>
      
      {/* Footer: result count + clear */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
        <span className="text-xs font-mono text-foreground-muted">
          {catalystCount} catalyst{catalystCount !== 1 ? "s" : ""}
        </span>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-mono text-foreground-subtle hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

// Filter chip component
interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}

function FilterChip({ label, active, onClick, color }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 text-xs font-mono transition-colors border",
        active
          ? "border-current bg-current/10"
          : "border-border text-foreground-muted hover:text-foreground hover:border-foreground-subtle"
      )}
      style={active && color ? { color, borderColor: color } : undefined}
    >
      {label}
    </button>
  );
}

