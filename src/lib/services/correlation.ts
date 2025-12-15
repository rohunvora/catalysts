// Price Correlation Engine
// Links price movements (pumps/dumps) to recent catalysts
// This is the KEY feature for "why is this coin pumping?"

import { CatalystCard, Direction, Severity } from "@/types/catalyst";
import { getTokenPrice, detectPriceAnomaly, PriceAnomaly } from "./jupiter";
import { getTokenWithMarketData, TokenInfo } from "./token-registry";
import { generateSocialCatalysts } from "./lunarcrush";
import { searchTokenTweets, tweetsToNewsItems, filterSpamTweets, filterHighSignalTweets } from "../twitter";
import { generateCatalystFromNews, rankNewsByRelevance } from "../catalyst-generator";

// ============================================================================
// Types
// ============================================================================

export interface PriceMovement {
  mint: string;
  symbol: string;
  currentPrice: number;
  priceChange: number;      // Percentage
  volumeChange?: number;    // Percentage
  timeWindow: number;       // Minutes
  direction: "pump" | "dump" | "stable";
  magnitude: "minor" | "moderate" | "major" | "extreme";
  detectedAt: string;
}

export interface CorrelatedCatalyst {
  catalyst: CatalystCard;
  correlationScore: number;  // 0-1
  lagMinutes: number;        // Time between catalyst and price move
  reasoning: string;
}

export interface PriceAlert {
  movement: PriceMovement;
  correlatedCatalysts: CorrelatedCatalyst[];
  topCatalyst: CorrelatedCatalyst | null;
  summary: string;
  confidence: number;
}

// ============================================================================
// In-Memory Catalyst Buffer (for correlation lookback)
// ============================================================================

// Store recent catalysts for each token (last 24h)
const catalystBuffer = new Map<string, CatalystCard[]>();
const BUFFER_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export function bufferCatalyst(catalyst: CatalystCard): void {
  const mint = catalyst.asset.mint;
  const existing = catalystBuffer.get(mint) || [];
  
  // Add new catalyst
  existing.push(catalyst);
  
  // Clean old catalysts
  const cutoff = Date.now() - BUFFER_MAX_AGE;
  const filtered = existing.filter(c => new Date(c.ts).getTime() > cutoff);
  
  catalystBuffer.set(mint, filtered);
}

export function getCatalystsInWindow(
  mint: string,
  startTime: Date,
  endTime: Date
): CatalystCard[] {
  const catalysts = catalystBuffer.get(mint) || [];
  
  return catalysts.filter(c => {
    const ts = new Date(c.ts).getTime();
    return ts >= startTime.getTime() && ts <= endTime.getTime();
  });
}

// ============================================================================
// Price Movement Detection
// ============================================================================

/**
 * Classify the magnitude of a price movement
 */
function classifyMagnitude(changePercent: number): PriceMovement["magnitude"] {
  const abs = Math.abs(changePercent);
  if (abs >= 50) return "extreme";
  if (abs >= 20) return "major";
  if (abs >= 10) return "moderate";
  return "minor";
}

/**
 * Detect significant price movements for a token
 */
export async function detectPriceMovement(
  mint: string,
  symbol: string,
  thresholdPercent: number = 10
): Promise<PriceMovement | null> {
  // Get current price
  const priceData = await getTokenPrice(mint);
  if (!priceData) return null;
  
  // Use the anomaly detector
  const anomaly = detectPriceAnomaly(mint, symbol, priceData.price, thresholdPercent);
  
  if (!anomaly || !anomaly.isAnomaly) {
    return null;
  }
  
  return {
    mint,
    symbol,
    currentPrice: anomaly.currentPrice,
    priceChange: anomaly.changePercent,
    timeWindow: 30, // Based on our anomaly detection window
    direction: anomaly.direction,
    magnitude: classifyMagnitude(anomaly.changePercent),
    detectedAt: anomaly.detectedAt,
  };
}

/**
 * Monitor multiple tokens for price movements
 */
export async function monitorPriceMovements(
  mints: Array<{ mint: string; symbol: string }>,
  thresholdPercent: number = 10
): Promise<PriceMovement[]> {
  const movements: PriceMovement[] = [];
  
  const promises = mints.map(async ({ mint, symbol }) => {
    const movement = await detectPriceMovement(mint, symbol, thresholdPercent);
    if (movement) {
      movements.push(movement);
    }
  });
  
  await Promise.all(promises);
  return movements;
}

// ============================================================================
// Catalyst Correlation
// ============================================================================

/**
 * Score how well a catalyst correlates with a price movement
 */
function scoreCatalystCorrelation(
  catalyst: CatalystCard,
  movement: PriceMovement
): { score: number; reasoning: string } {
  let score = 0;
  const reasons: string[] = [];
  
  // 1. Direction alignment (max 0.3)
  const catalystDirection = catalyst.direction;
  const priceDirection = movement.direction === "pump" ? "BULLISH" : 
                         movement.direction === "dump" ? "BEARISH" : "NEUTRAL";
  
  if (catalystDirection === priceDirection) {
    score += 0.3;
    reasons.push("Direction matches");
  } else if (catalystDirection === "NEUTRAL") {
    score += 0.1;
    reasons.push("Neutral catalyst");
  }
  
  // 2. Time proximity (max 0.3)
  const catalystTime = new Date(catalyst.ts).getTime();
  const moveTime = new Date(movement.detectedAt).getTime();
  const lagMinutes = (moveTime - catalystTime) / 60000;
  
  if (lagMinutes >= 0 && lagMinutes <= 120) {
    // Catalyst came before price move (correct order)
    const timeScore = Math.max(0, 0.3 * (1 - lagMinutes / 120));
    score += timeScore;
    reasons.push(`${lagMinutes.toFixed(0)}min before move`);
  } else if (lagMinutes < 0 && lagMinutes >= -30) {
    // Catalyst came slightly after (market may have reacted first)
    score += 0.15;
    reasons.push("Shortly after move started");
  }
  
  // 3. Event type relevance (max 0.2)
  const highImpactEvents = ["LISTING_STATUS", "WHALE_FLOW", "INCIDENT", "TEAM_SHIP"];
  if (highImpactEvents.includes(catalyst.event_type)) {
    score += 0.2;
    reasons.push(`High-impact event: ${catalyst.event_type}`);
  } else {
    score += 0.1;
  }
  
  // 4. Severity match (max 0.1)
  if (catalyst.severity === "HIGH" && (movement.magnitude === "major" || movement.magnitude === "extreme")) {
    score += 0.1;
    reasons.push("High severity matches major move");
  } else if (catalyst.severity === "MED" && movement.magnitude === "moderate") {
    score += 0.1;
    reasons.push("Medium severity matches moderate move");
  }
  
  // 5. Source credibility (max 0.1)
  if (catalyst.confidence > 0.8) {
    score += 0.1;
    reasons.push("High confidence source");
  } else if (catalyst.confidence > 0.5) {
    score += 0.05;
  }
  
  return {
    score: Math.min(1, score),
    reasoning: reasons.join("; "),
  };
}

/**
 * Find catalysts that correlate with a price movement
 */
export function correlateCatalysts(
  movement: PriceMovement,
  lookbackHours: number = 2
): CorrelatedCatalyst[] {
  // Look for catalysts in the window before the price move
  const moveTime = new Date(movement.detectedAt);
  const windowStart = new Date(moveTime.getTime() - lookbackHours * 60 * 60 * 1000);
  const windowEnd = new Date(moveTime.getTime() + 30 * 60 * 1000); // Include 30min after
  
  const candidates = getCatalystsInWindow(movement.mint, windowStart, windowEnd);
  
  // Score each catalyst
  const correlated: CorrelatedCatalyst[] = candidates.map(catalyst => {
    const { score, reasoning } = scoreCatalystCorrelation(catalyst, movement);
    const lagMinutes = (moveTime.getTime() - new Date(catalyst.ts).getTime()) / 60000;
    
    return {
      catalyst,
      correlationScore: score,
      lagMinutes,
      reasoning,
    };
  });
  
  // Sort by score and filter low-scoring
  return correlated
    .filter(c => c.correlationScore > 0.3)
    .sort((a, b) => b.correlationScore - a.correlationScore);
}

// ============================================================================
// Price Alert Generation
// ============================================================================

/**
 * Generate a price alert with correlated catalysts
 */
export function generatePriceAlert(
  movement: PriceMovement,
  correlatedCatalysts: CorrelatedCatalyst[]
): PriceAlert {
  const topCatalyst = correlatedCatalysts.length > 0 ? correlatedCatalysts[0] : null;
  
  // Generate summary
  let summary: string;
  let confidence: number;
  
  if (topCatalyst && topCatalyst.correlationScore > 0.6) {
    summary = `${movement.symbol} ${movement.direction === "pump" ? "📈" : "📉"} ${movement.priceChange > 0 ? "+" : ""}${movement.priceChange.toFixed(1)}% | Likely cause: ${topCatalyst.catalyst.headline}`;
    confidence = topCatalyst.correlationScore;
  } else if (topCatalyst) {
    summary = `${movement.symbol} ${movement.direction === "pump" ? "📈" : "📉"} ${movement.priceChange > 0 ? "+" : ""}${movement.priceChange.toFixed(1)}% | Possible cause: ${topCatalyst.catalyst.headline}`;
    confidence = topCatalyst.correlationScore * 0.8;
  } else {
    summary = `${movement.symbol} ${movement.direction === "pump" ? "📈" : "📉"} ${movement.priceChange > 0 ? "+" : ""}${movement.priceChange.toFixed(1)}% | No clear catalyst identified`;
    confidence = 0.2;
  }
  
  return {
    movement,
    correlatedCatalysts,
    topCatalyst,
    summary,
    confidence,
  };
}

/**
 * Convert a price alert to a CatalystCard
 */
export function priceAlertToCatalystCard(alert: PriceAlert): CatalystCard {
  const { movement, topCatalyst } = alert;
  const now = new Date().toISOString();
  
  const direction: Direction = movement.direction === "pump" ? "BULLISH" : 
                               movement.direction === "dump" ? "BEARISH" : "NEUTRAL";
  
  const severity: Severity = movement.magnitude === "extreme" ? "HIGH" :
                             movement.magnitude === "major" ? "HIGH" :
                             movement.magnitude === "moderate" ? "MED" : "LOW";
  
  const evidence = topCatalyst 
    ? [...topCatalyst.catalyst.evidence]
    : [];
  
  // Add price data source
  evidence.push({
    kind: "api_source",
    ref: "price-movement-detector",
    explorer_url: `https://dexscreener.com/solana/${movement.mint}`,
    label: "DexScreener chart",
  });
  
  return {
    id: `solana:${movement.symbol}:${now}:PRICE_ALERT`,
    dedupe_key: `${movement.symbol.toLowerCase()}-price-alert-${Date.now()}`,
    asset: {
      chain: "solana",
      mint: movement.mint,
      symbol: movement.symbol,
    },
    ts: now,
    first_seen: now,
    event_type: "WHALE_FLOW", // Using WHALE_FLOW as closest match; could add PRICE_ALERT type
    severity,
    time_horizon: "INTRADAY",
    direction,
    headline: alert.summary,
    key_numbers: [
      { label: "price_change", value: movement.priceChange, unit: "%" },
      { label: "current_price", value: movement.currentPrice, unit: "USD" },
      ...(topCatalyst ? [
        { label: "correlation", value: Math.round(topCatalyst.correlationScore * 100), unit: "%" },
        { label: "catalyst_lag", value: Math.round(topCatalyst.lagMinutes), unit: "min" },
      ] : []),
    ],
    so_what: topCatalyst ? [
      `Price moved ${Math.abs(movement.priceChange).toFixed(1)}% within ${Math.round(topCatalyst.lagMinutes)} minutes of catalyst.`,
      topCatalyst.reasoning,
    ] : [
      `Significant ${movement.magnitude} price movement detected.`,
      "No clear catalyst identified in recent social/on-chain activity.",
    ],
    confidence: alert.confidence,
    source_count: evidence.length,
    evidence,
    entities: topCatalyst?.catalyst.entities,
    simulated: false,
  };
}

// ============================================================================
// Full Pipeline: Detect Movement → Find Catalysts → Generate Alert
// ============================================================================

/**
 * Full detection pipeline for a single token
 */
export async function detectAndCorrelateSingle(
  mint: string,
  symbol: string,
  thresholdPercent: number = 10
): Promise<PriceAlert | null> {
  // 1. Detect price movement
  const movement = await detectPriceMovement(mint, symbol, thresholdPercent);
  
  if (!movement) {
    return null;
  }
  
  // 2. Find correlated catalysts
  const correlated = correlateCatalysts(movement);
  
  // 3. Generate alert
  return generatePriceAlert(movement, correlated);
}

/**
 * Fetch fresh catalysts for a token and add to buffer
 * Call this periodically to keep the catalyst buffer fresh
 */
export async function refreshCatalystBuffer(
  mint: string,
  symbol: string,
  tokenName?: string
): Promise<number> {
  let addedCount = 0;
  
  try {
    // 1. Get social catalysts from LunarCrush
    const socialCatalysts = await generateSocialCatalysts(symbol, mint);
    for (const catalyst of socialCatalysts) {
      bufferCatalyst(catalyst);
      addedCount++;
    }
    
    // 2. Get Twitter catalysts
    const tweets = await searchTokenTweets(mint, symbol, tokenName);
    const rankedTweets = rankNewsByRelevance(tweets, symbol);
    
    for (const news of rankedTweets.slice(0, 5)) {
      const catalyst = generateCatalystFromNews(news, symbol, mint);
      bufferCatalyst(catalyst);
      addedCount++;
    }
    
  } catch (error) {
    console.error(`Error refreshing catalyst buffer for ${symbol}:`, error);
  }
  
  return addedCount;
}

/**
 * Main monitoring loop - call this periodically
 */
export async function runCorrelationCycle(
  tokens: Array<{ mint: string; symbol: string; name?: string }>,
  options: {
    priceThreshold?: number;
    refreshCatalysts?: boolean;
  } = {}
): Promise<PriceAlert[]> {
  const alerts: PriceAlert[] = [];
  const priceThreshold = options.priceThreshold || 10;
  
  for (const token of tokens) {
    try {
      // Optionally refresh catalyst buffer
      if (options.refreshCatalysts) {
        await refreshCatalystBuffer(token.mint, token.symbol, token.name);
      }
      
      // Detect and correlate
      const alert = await detectAndCorrelateSingle(
        token.mint,
        token.symbol,
        priceThreshold
      );
      
      if (alert) {
        alerts.push(alert);
      }
      
    } catch (error) {
      console.error(`Error processing ${token.symbol}:`, error);
    }
  }
  
  // Sort by confidence
  return alerts.sort((a, b) => b.confidence - a.confidence);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get buffer stats for debugging
 */
export function getBufferStats(): Map<string, number> {
  const stats = new Map<string, number>();
  
  for (const [mint, catalysts] of catalystBuffer) {
    stats.set(mint, catalysts.length);
  }
  
  return stats;
}

/**
 * Clear correlation buffers
 */
export function clearBuffers(): void {
  catalystBuffer.clear();
}

/**
 * Manually add a catalyst to the buffer (for testing or manual input)
 */
export function addCatalystToBuffer(catalyst: CatalystCard): void {
  bufferCatalyst(catalyst);
}

