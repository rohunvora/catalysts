// Event types - the only 8 that matter for terminals
export type EventType =
  | "WHALE_FLOW"        // Large buy/sell/transfer to/from known venues
  | "LIQUIDITY_CHANGE"  // LP added/removed, pool migrated, depth collapses
  | "SUPPLY_FLOAT"      // Stake lock, unlock, emissions change, mint, burn
  | "PRIVILEGE_CHANGE"  // Mint/freeze/blacklist/upgrade authority changed
  | "INCIDENT"          // RPC issues, halted program, exploit, investigating
  | "LISTING_STATUS"    // Confirmed listing/market added (only confirmed)
  | "TEAM_SHIP"         // Release, mainnet upgrade, migration complete
  | "SOCIAL_MATERIAL";  // Official post that changes expectations

export type Severity = "LOW" | "MED" | "HIGH";

export type TimeHorizon = "INTRADAY" | "SWING" | "LONGER";

export type Direction = "BULLISH" | "BEARISH" | "NEUTRAL";

export type EvidenceKind = 
  | "onchain_tx" 
  | "official_post" 
  | "repo_commit" 
  | "api_source";

export type EntityType = "wallet" | "program" | "venue";

// Evidence with full URLs - no guessing how to construct links
export interface Evidence {
  kind: EvidenceKind;
  ref: string;              // Raw ID/signature
  explorer_url: string;     // Direct clickable link (Solscan, X, GitHub)
  source_url?: string;      // Alternative source
  label: string;            // "Solscan tx", "X post", "GitHub commit"
}

// Entities touched by the event (for hover tooltips, cross-links)
export interface Entity {
  type: EntityType;
  address: string;
  label?: string;           // "Known CEX", "Jupiter Program", etc.
}

// Key numbers extracted from the event
export interface KeyNumber {
  label: string;            // "amount", "lock", "float_pct"
  value: number;
  unit: string;             // "BONK", "days", "%", "USD"
  delta?: number;           // Change from previous (if applicable)
}

// The core catalyst card structure
export interface CatalystCard {
  id: string;               // "solana:BONK:2025-12-14T13:01:00Z:WHALE_FLOW"
  dedupe_key: string;       // Stable key for same event, updated numbers
  
  asset: {
    chain: "solana";
    mint: string;           // Real mint address
    symbol: string;
    name?: string;
  };
  
  ts: string;               // ISO timestamp of the event
  first_seen: string;       // When we first detected
  updated_at?: string;      // If card evolved
  
  event_type: EventType;
  severity: Severity;
  time_horizon: TimeHorizon;
  direction?: Direction;
  
  headline: string;         // Short, scannable headline
  key_numbers: KeyNumber[];
  so_what: string[];        // 2 bullets max - why this matters
  
  confidence: number;       // 0-1
  source_count: number;     // Number of evidence items
  
  evidence: Evidence[];
  entities?: Entity[];      // Wallets/programs/venues touched
  calcs?: Record<string, string>; // How numbers were computed
  
  simulated?: boolean;      // If true, clearly marked in UI
}

// Token metadata for the demo
export interface Token {
  chain: "solana";
  mint: string;
  symbol: string;
  name: string;
  logo?: string;
}

// Filter state for the UI
export interface FilterState {
  tokens: string[];         // mint addresses
  eventTypes: EventType[];
  severities: Severity[];
  timeHorizons: TimeHorizon[];
}

// View mode toggle
export type ViewMode = "compact" | "full";

// Event type metadata for UI
export const EVENT_TYPE_META: Record<EventType, { label: string; color: string; description: string }> = {
  WHALE_FLOW: {
    label: "Whale Flow",
    color: "var(--event-whale)",
    description: "Large buy/sell/transfer to/from known venues or fresh wallet accumulation"
  },
  LIQUIDITY_CHANGE: {
    label: "Liquidity",
    color: "var(--event-liquidity)",
    description: "LP added/removed, pool migrated, depth changes"
  },
  SUPPLY_FLOAT: {
    label: "Supply/Float",
    color: "var(--event-supply)",
    description: "Stake lock, unlock, emissions change, new mint authority, burn"
  },
  PRIVILEGE_CHANGE: {
    label: "Privilege",
    color: "var(--event-privilege)",
    description: "Mint/freeze/blacklist/upgrade authority changed or confirmed present"
  },
  INCIDENT: {
    label: "Incident",
    color: "var(--event-incident)",
    description: "RPC issues, halted program, exploit, investigating"
  },
  LISTING_STATUS: {
    label: "Listing",
    color: "var(--event-listing)",
    description: "Confirmed listing or market added"
  },
  TEAM_SHIP: {
    label: "Team Ship",
    color: "var(--event-ship)",
    description: "Release, mainnet upgrade, migration complete"
  },
  SOCIAL_MATERIAL: {
    label: "Social",
    color: "var(--event-social)",
    description: "Official post that changes expectations (roadmap, tokenomics)"
  }
};

export const SEVERITY_META: Record<Severity, { label: string; color: string }> = {
  LOW: { label: "Low", color: "var(--severity-low)" },
  MED: { label: "Med", color: "var(--severity-med)" },
  HIGH: { label: "High", color: "var(--severity-high)" }
};

export const TIME_HORIZON_META: Record<TimeHorizon, { label: string; description: string }> = {
  INTRADAY: { label: "Intraday", description: "Relevant for same-day trading" },
  SWING: { label: "Swing", description: "Days to weeks relevance" },
  LONGER: { label: "Longer", description: "Weeks to months relevance" }
};

export const DIRECTION_META: Record<Direction, { label: string; color: string }> = {
  BULLISH: { label: "Bullish", color: "var(--accent-success)" },
  BEARISH: { label: "Bearish", color: "var(--accent-danger)" },
  NEUTRAL: { label: "Neutral", color: "var(--foreground-muted)" }
};

