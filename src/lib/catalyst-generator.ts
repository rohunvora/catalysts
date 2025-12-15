// Catalyst card generation from raw data sources

import { CatalystCard, EventType, Severity, TimeHorizon, Evidence, KeyNumber } from "@/types/catalyst";

export interface RawNewsItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
  date?: string;
}

export interface GeneratedCatalyst {
  event_type: EventType;
  severity: Severity;
  time_horizon: TimeHorizon;
  headline: string;
  key_numbers: KeyNumber[];
  so_what: string[];
  evidence: Evidence[];
  confidence: number;
  direction?: "BULLISH" | "BEARISH" | "NEUTRAL";
}

// Keywords that indicate different event types
const EVENT_KEYWORDS: Record<EventType, string[]> = {
  WHALE_FLOW: ["whale", "large transfer", "moved", "deposited", "withdrew", "accumulation", "dump", "sell-off"],
  LIQUIDITY_CHANGE: ["liquidity", "LP", "pool", "TVL", "depth", "slippage", "AMM", "DEX"],
  SUPPLY_FLOAT: ["unlock", "vesting", "lock", "stake", "burn", "mint", "emission", "supply", "circulating"],
  PRIVILEGE_CHANGE: ["authority", "upgrade", "multisig", "governance", "admin", "owner", "contract"],
  INCIDENT: ["hack", "exploit", "bug", "issue", "down", "degraded", "investigating", "vulnerability", "pause"],
  LISTING_STATUS: ["listing", "listed", "exchange", "trading", "launch", "available", "Binance", "Coinbase", "Kraken"],
  TEAM_SHIP: ["release", "v2", "upgrade", "launch", "mainnet", "update", "feature", "shipped", "deployed"],
  SOCIAL_MATERIAL: ["announced", "partnership", "collaboration", "roadmap", "tokenomics", "airdrop"],
};

// Severity indicators
const HIGH_SEVERITY_KEYWORDS = ["hack", "exploit", "major", "massive", "urgent", "critical", "million", "billion"];
const LOW_SEVERITY_KEYWORDS = ["minor", "small", "routine", "scheduled", "planned"];

// Classify event type from text
export function classifyEventType(text: string): EventType {
  const lowerText = text.toLowerCase();
  
  // Score each event type based on keyword matches
  const scores: Record<EventType, number> = {
    WHALE_FLOW: 0,
    LIQUIDITY_CHANGE: 0,
    SUPPLY_FLOAT: 0,
    PRIVILEGE_CHANGE: 0,
    INCIDENT: 0,
    LISTING_STATUS: 0,
    TEAM_SHIP: 0,
    SOCIAL_MATERIAL: 0,
  };
  
  for (const [eventType, keywords] of Object.entries(EVENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[eventType as EventType] += 1;
      }
    }
  }
  
  // Find highest scoring event type
  let maxScore = 0;
  let bestType: EventType = "SOCIAL_MATERIAL"; // default
  
  for (const [eventType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestType = eventType as EventType;
    }
  }
  
  return bestType;
}

// Determine severity from text
export function classifySeverity(text: string): Severity {
  const lowerText = text.toLowerCase();
  
  for (const keyword of HIGH_SEVERITY_KEYWORDS) {
    if (lowerText.includes(keyword)) return "HIGH";
  }
  
  for (const keyword of LOW_SEVERITY_KEYWORDS) {
    if (lowerText.includes(keyword)) return "LOW";
  }
  
  return "MED";
}

// Extract numbers from text
export function extractNumbers(text: string): KeyNumber[] {
  const numbers: KeyNumber[] = [];
  
  // Match patterns like "$1.5M", "500K tokens", "15%", etc.
  const patterns = [
    { regex: /\$(\d+(?:\.\d+)?)\s*(B|M|K|billion|million|thousand)?/gi, unit: "USD" },
    { regex: /(\d+(?:\.\d+)?)\s*(B|M|K|billion|million|thousand)?\s*tokens?/gi, unit: "tokens" },
    { regex: /(\d+(?:\.\d+)?)\s*%/g, unit: "%" },
    { regex: /(\d+(?:\.\d+)?)\s*(B|M|K|billion|million|thousand)?\s*(?:BONK|JUP|WIF|SOL|USDC|USDT)/gi, unit: "tokens" },
  ];
  
  for (const { regex, unit } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      let value = parseFloat(match[1]);
      const multiplier = match[2]?.toUpperCase();
      
      if (multiplier === "B" || multiplier === "BILLION") value *= 1e9;
      else if (multiplier === "M" || multiplier === "MILLION") value *= 1e6;
      else if (multiplier === "K" || multiplier === "THOUSAND") value *= 1e3;
      
      numbers.push({
        label: "value",
        value,
        unit,
      });
    }
  }
  
  return numbers.slice(0, 3); // Max 3 numbers
}

// Generate "so what" analysis bullets
export function generateSoWhat(eventType: EventType, text: string): string[] {
  const soWhats: Record<EventType, string[]> = {
    WHALE_FLOW: [
      "Large wallet movements can signal upcoming volatility—watch order book depth.",
      "Track if this is accumulation or distribution pattern over the next 24-48h.",
    ],
    LIQUIDITY_CHANGE: [
      "LP changes directly impact slippage and executable size for trades.",
      "Significant depth reduction increases risk of cascading liquidations.",
    ],
    SUPPLY_FLOAT: [
      "Supply unlocks increase sellable float—watch for distribution patterns.",
      "Lock events reduce near-term sell pressure but watch unlock schedules.",
    ],
    PRIVILEGE_CHANGE: [
      "Authority changes affect contract upgrade risk and rug vectors.",
      "Verify the new authority is multisig or known trusted entity.",
    ],
    INCIDENT: [
      "Monitor official channels for resolution timeline and scope.",
      "Consider reducing exposure until root cause is identified.",
    ],
    LISTING_STATUS: [
      "New exchange listings typically drive 24-72h momentum from retail inflows.",
      "Watch initial volume and funding rates for sentiment signal.",
    ],
    TEAM_SHIP: [
      "Product releases can drive narrative momentum if well-received.",
      "Watch community reaction and adoption metrics post-launch.",
    ],
    SOCIAL_MATERIAL: [
      "Official announcements often front-run actual implementation—verify timelines.",
      "Market may have already priced in if leaked or teased earlier.",
    ],
  };
  
  return soWhats[eventType] || ["Monitor for follow-up developments.", "Verify claims against primary sources."];
}

// Determine time horizon
export function classifyTimeHorizon(eventType: EventType, text: string): TimeHorizon {
  const lowerText = text.toLowerCase();
  
  // Immediate events
  if (lowerText.includes("today") || lowerText.includes("now") || lowerText.includes("just")) {
    return "INTRADAY";
  }
  
  // Long-term events
  if (lowerText.includes("year") || lowerText.includes("2026") || lowerText.includes("roadmap")) {
    return "LONGER";
  }
  
  // Event type defaults
  const defaults: Record<EventType, TimeHorizon> = {
    WHALE_FLOW: "INTRADAY",
    LIQUIDITY_CHANGE: "INTRADAY",
    SUPPLY_FLOAT: "SWING",
    PRIVILEGE_CHANGE: "LONGER",
    INCIDENT: "INTRADAY",
    LISTING_STATUS: "SWING",
    TEAM_SHIP: "SWING",
    SOCIAL_MATERIAL: "SWING",
  };
  
  return defaults[eventType];
}

// Determine direction
export function classifyDirection(text: string): "BULLISH" | "BEARISH" | "NEUTRAL" {
  const lowerText = text.toLowerCase();
  
  const bullishKeywords = ["bullish", "buy", "accumulation", "listing", "launch", "upgrade", "burn", "lock", "partnership"];
  const bearishKeywords = ["bearish", "sell", "dump", "unlock", "hack", "exploit", "issue", "down", "withdraw"];
  
  let bullishScore = 0;
  let bearishScore = 0;
  
  for (const kw of bullishKeywords) {
    if (lowerText.includes(kw)) bullishScore++;
  }
  for (const kw of bearishKeywords) {
    if (lowerText.includes(kw)) bearishScore++;
  }
  
  if (bullishScore > bearishScore) return "BULLISH";
  if (bearishScore > bullishScore) return "BEARISH";
  return "NEUTRAL";
}

// Main function: Generate catalyst from raw news/social data
export function generateCatalystFromNews(
  news: RawNewsItem,
  tokenSymbol: string,
  tokenMint: string
): CatalystCard {
  const combinedText = `${news.title} ${news.snippet}`;
  
  const eventType = classifyEventType(combinedText);
  const severity = classifySeverity(combinedText);
  const timeHorizon = classifyTimeHorizon(eventType, combinedText);
  const direction = classifyDirection(combinedText);
  const keyNumbers = extractNumbers(combinedText);
  const soWhat = generateSoWhat(eventType, combinedText);
  
  // Clean up headline - use title or first sentence of snippet
  let headline = news.title;
  if (headline.length > 100) {
    headline = headline.substring(0, 97) + "...";
  }
  
  const now = new Date().toISOString();
  const id = `solana:${tokenSymbol}:${now}:${eventType}`;
  
  return {
    id,
    dedupe_key: `${tokenSymbol.toLowerCase()}-${eventType.toLowerCase()}-${Date.now()}`,
    asset: {
      chain: "solana",
      mint: tokenMint,
      symbol: tokenSymbol,
    },
    ts: news.date || now,
    first_seen: now,
    event_type: eventType,
    severity,
    time_horizon: timeHorizon,
    direction,
    headline,
    key_numbers: keyNumbers,
    so_what: soWhat,
    confidence: 0.7, // Lower confidence for auto-generated
    source_count: 1,
    evidence: [
      {
        kind: news.url.includes("twitter.com") || news.url.includes("x.com") 
          ? "official_post" 
          : "api_source",
        ref: news.url,
        explorer_url: news.url,
        label: news.source,
      }
    ],
    simulated: false, // This is real data!
  };
}

// Filter and rank news items by relevance
export function rankNewsByRelevance(newsItems: RawNewsItem[], tokenSymbol: string): RawNewsItem[] {
  return newsItems
    .map(item => {
      let score = 0;
      const text = `${item.title} ${item.snippet}`.toLowerCase();
      
      // Boost if mentions the token
      if (text.includes(tokenSymbol.toLowerCase())) score += 10;
      
      // Boost for high-signal event types
      for (const keywords of Object.values(EVENT_KEYWORDS)) {
        for (const kw of keywords) {
          if (text.includes(kw.toLowerCase())) score += 2;
        }
      }
      
      // Penalize generic content
      if (text.includes("price prediction") || text.includes("should you buy")) score -= 5;
      
      return { item, score };
    })
    .filter(({ score }) => score > 5) // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

