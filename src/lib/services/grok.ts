// Grok/xAI API integration for real-time X data + narrative extraction

import { CatalystCard, EventType, Severity, TimeHorizon, Direction } from "@/types/catalyst";

const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";
const GROK_API_BASE = "https://api.x.ai/v1";

export function isGrokConfigured(): boolean {
  return GROK_API_KEY.length > 0;
}

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Call Grok API with live search enabled
async function callGrok(
  messages: GrokMessage[],
  options: {
    model?: string;
    temperature?: number;
    search?: boolean;
  } = {}
): Promise<string | null> {
  if (!GROK_API_KEY) {
    console.log("No Grok API key configured");
    return null;
  }

  const { model = "grok-3-latest", temperature = 0.3, search = true } = options;

  try {
    const response = await fetch(`${GROK_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        // Enable live search for real-time X data
        ...(search && {
          search_parameters: {
            mode: "auto", // Let Grok decide when to search
            sources: [
              { type: "x" },     // Search X/Twitter
              { type: "web" },   // Also search web
              { type: "news" },  // And news
            ],
            max_search_results: 20,
            return_citations: true,
          },
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Grok API error:", response.status, error);
      return null;
    }

    const data: GrokResponse = await response.json();
    return data.choices[0]?.message?.content || null;

  } catch (error) {
    console.error("Grok API call failed:", error);
    return null;
  }
}

// Token narrative analysis result
export interface TokenNarrative {
  // What is this token?
  summary: string;
  category: "memecoin" | "defi" | "ai" | "gaming" | "infrastructure" | "other";
  thesis: string;
  risk_factors: string[];
  
  // Latest catalyst
  latest_catalyst: {
    headline: string;
    event_type: EventType;
    severity: Severity;
    time_horizon: TimeHorizon;
    direction: Direction;
    why_it_matters: string[];
    confidence: number;
    source_urls: string[];
  } | null;
  
  // Social sentiment
  sentiment: "very_bearish" | "bearish" | "neutral" | "bullish" | "very_bullish";
  buzz_level: "dead" | "low" | "moderate" | "high" | "viral";
  
  // Key accounts discussing
  notable_mentions: Array<{
    account: string;
    snippet: string;
    url: string;
  }>;
}

// Main function: Get token narrative from Grok with live X search
export async function getTokenNarrativeFromGrok(
  symbol: string,
  name: string,
  mint: string
): Promise<TokenNarrative | null> {
  
  const systemPrompt = `You are a crypto analyst with real-time access to X (Twitter) posts. Your job is to analyze social sentiment and identify catalysts for crypto tokens.

IMPORTANT RULES:
- Only report FACTS from actual posts you find - never make things up
- Ignore obvious scams: airdrops, "claim now", phishing, bots with random numbers in names
- Focus on posts from real traders, analysts, or official project accounts
- If you can't find relevant posts, say so honestly
- Extract specific numbers when mentioned (prices, volumes, market caps)

Output your analysis as valid JSON matching this schema:
{
  "summary": "1-2 sentence explanation of what this token is",
  "category": "memecoin|defi|ai|gaming|infrastructure|other",
  "thesis": "The bull case - why would traders be interested?",
  "risk_factors": ["risk 1", "risk 2"],
  "latest_catalyst": {
    "headline": "The most important recent event/news",
    "event_type": "WHALE_FLOW|LIQUIDITY_CHANGE|SUPPLY_FLOAT|PRIVILEGE_CHANGE|INCIDENT|LISTING_STATUS|TEAM_SHIP|SOCIAL_MATERIAL",
    "severity": "LOW|MED|HIGH",
    "time_horizon": "INTRADAY|SWING|LONGER",
    "direction": "BULLISH|BEARISH|NEUTRAL",
    "why_it_matters": ["bullet 1", "bullet 2"],
    "confidence": 0.0-1.0,
    "source_urls": ["https://x.com/..."]
  },
  "sentiment": "very_bearish|bearish|neutral|bullish|very_bullish",
  "buzz_level": "dead|low|moderate|high|viral",
  "notable_mentions": [
    {"account": "@username", "snippet": "key quote", "url": "https://x.com/..."}
  ]
}

If no meaningful catalyst found, set latest_catalyst to null.
If no posts found at all, return summary as "No recent social activity found" and buzz_level as "dead".`;

  const userPrompt = `Search X/Twitter for recent posts about the Solana token "${name}" (symbol: $${symbol}, contract: ${mint}).

Find:
1. What is this token? (memecoin, defi, ai project, etc.)
2. What's the latest catalyst or news? (listings, whale moves, team updates, etc.)
3. What's the overall sentiment and buzz level?
4. Who are notable accounts discussing it?

Focus on posts from the last 24-48 hours. Ignore airdrop scams and bot spam.`;

  console.log(`Calling Grok for ${symbol} narrative...`);
  
  const response = await callGrok([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], { search: true });

  if (!response) {
    return null;
  }

  try {
    // Extract JSON from response (might be wrapped in markdown)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Grok response:", response.substring(0, 200));
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as TokenNarrative;
    console.log(`Grok narrative: ${parsed.summary.substring(0, 80)}...`);
    return parsed;

  } catch (error) {
    console.error("Failed to parse Grok response:", error);
    console.error("Raw response:", response.substring(0, 500));
    return null;
  }
}

// Convert Grok narrative to CatalystCard format
export function narrativeToCatalystCard(
  narrative: TokenNarrative,
  symbol: string,
  mint: string
): CatalystCard | null {
  if (!narrative.latest_catalyst) {
    return null;
  }

  const catalyst = narrative.latest_catalyst;
  const now = new Date().toISOString();

  return {
    id: `solana:${symbol}:${now}:${catalyst.event_type}:grok`,
    dedupe_key: `${symbol.toLowerCase()}-grok-${Date.now()}`,
    asset: {
      chain: "solana",
      mint,
      symbol,
    },
    ts: now,
    first_seen: now,
    event_type: catalyst.event_type,
    severity: catalyst.severity,
    time_horizon: catalyst.time_horizon,
    direction: catalyst.direction,
    headline: catalyst.headline,
    key_numbers: [],
    so_what: catalyst.why_it_matters,
    confidence: catalyst.confidence,
    source_count: catalyst.source_urls.length,
    evidence: catalyst.source_urls.map(url => ({
      kind: "official_post" as const,
      ref: url,
      explorer_url: url,
      label: url.includes("x.com") ? "X post" : "Source",
    })),
    simulated: false,
  };
}

// Generate multiple catalyst cards from notable mentions
export function mentionsToCatalystCards(
  narrative: TokenNarrative,
  symbol: string,
  mint: string
): CatalystCard[] {
  const now = new Date().toISOString();
  
  return narrative.notable_mentions.slice(0, 5).map((mention, i) => ({
    id: `solana:${symbol}:${now}:SOCIAL_MATERIAL:mention-${i}`,
    dedupe_key: `${symbol.toLowerCase()}-mention-${mention.account}-${Date.now()}`,
    asset: {
      chain: "solana",
      mint,
      symbol,
    },
    ts: now,
    first_seen: now,
    event_type: "SOCIAL_MATERIAL" as EventType,
    severity: "LOW" as Severity,
    time_horizon: "SWING" as TimeHorizon,
    direction: narrativeSentimentToDirection(narrative.sentiment),
    headline: `${mention.account}: ${mention.snippet}`,
    key_numbers: [],
    so_what: [
      `Posted by ${mention.account}`,
      `Overall sentiment: ${narrative.sentiment}`,
    ],
    confidence: 0.7,
    source_count: 1,
    evidence: [{
      kind: "official_post" as const,
      ref: mention.url,
      explorer_url: mention.url,
      label: mention.account,
    }],
    simulated: false,
  }));
}

function narrativeSentimentToDirection(sentiment: string): Direction {
  switch (sentiment) {
    case "very_bullish":
    case "bullish":
      return "BULLISH";
    case "very_bearish":
    case "bearish":
      return "BEARISH";
    default:
      return "NEUTRAL";
  }
}

