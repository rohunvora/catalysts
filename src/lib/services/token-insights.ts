// Token Insights - Simple AI summary for any token
// Inspired by Jupiter's "Chain Insights" feature
// Focus: "What is this token? Where did it come from?"

import { config } from "../config";
import { getTokenInfo, getTokenWithMarketData, TokenInfo } from "./token-registry";

// ============================================================================
// Types
// ============================================================================

export interface TokenInsight {
  // Basic info
  mint: string;
  symbol: string;
  name: string;
  
  // AI-generated insight
  summary: string;
  origin?: {
    source: string;      // "tweet", "pump.fun", "team launch", etc.
    creator?: string;    // @username or team name
    trigger?: string;    // What caused it (article, meme, event)
    url?: string;        // Link to origin if found
  };
  
  // Category
  category: "memecoin" | "defi" | "ai" | "gaming" | "infrastructure" | "celebrity" | "political" | "animal" | "other";
  
  // Market context (if available)
  market?: {
    price_usd: number;
    market_cap: number;
    age_days: number;
    liquidity: number;
  };
  
  // Meta
  generated_at: string;
  disclaimer: string;
}

// ============================================================================
// Grok Integration
// ============================================================================

const GROK_API_KEY = config.grok.apiKey;
const GROK_API_BASE = config.grok.apiUrl;

async function askGrok(prompt: string): Promise<string | null> {
  if (!GROK_API_KEY) {
    console.error("No Grok API key configured");
    return null;
  }

  try {
    const response = await fetch(`${GROK_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-latest",
        messages: [
          {
            role: "system",
            content: `You are an expert at finding information about new Solana memecoins on X/Twitter.

RULES:
- Search X thoroughly for any mentions of the token
- Be concise (2-3 sentences max)
- Focus on ORIGIN: Who launched it? What inspired it?
- If it's a memecoin, explain the joke/meme reference
- Include @username if you find who created or promoted it
- Say "unknown" if you genuinely can't find information
- Output valid JSON only, no markdown or explanatory text`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        search_parameters: {
          mode: "on", // Force search
          sources: [
            { type: "x" },  // Primary: X/Twitter
            { type: "web" } // Fallback: web
          ],
          max_search_results: 20,
          return_citations: true
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Grok API error:", response.status, error);
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;

  } catch (error) {
    console.error("Grok API call failed:", error);
    return null;
  }
}

// ============================================================================
// Main Function
// ============================================================================

export async function getTokenInsight(mint: string): Promise<TokenInsight | null> {
  // 1. Get basic token info from DexScreener/Jupiter
  const tokenInfo = await getTokenWithMarketData(mint);
  
  const symbol = tokenInfo?.symbol || "UNKNOWN";
  const name = tokenInfo?.name || symbol;
  
  console.log(`Getting insight for ${symbol} (${name}) - ${mint}...`);
  
  // 2. Ask Grok with improved prompt focused on X search
  const prompt = `Search X (Twitter) for recent posts about "$${symbol}" OR "${name}" on Solana.

This is likely a NEW memecoin. Find:
1. What is this token about? (1-2 sentences)
2. Who created it or first mentioned it? (look for pump.fun launches, crypto accounts)
3. What event/meme/news inspired it?
4. What category? (memecoin, defi, ai, gaming, infrastructure, celebrity, political, animal, other)

Look for:
- pump.fun launches
- Crypto trader accounts mentioning it
- News references if any
- The joke/meme if it's a memecoin

Contract: ${mint}

Return ONLY valid JSON:
{
  "summary": "What this token is in 1-2 sentences",
  "origin": {
    "source": "tweet|pump.fun|meme|news|unknown",
    "creator": "@username if found, or 'unknown'",
    "trigger": "what inspired the token",
    "url": "actual tweet URL if found, empty string if not"
  },
  "category": "memecoin|defi|ai|gaming|infrastructure|celebrity|political|animal|other"
}`;

  const grokResponse = await askGrok(prompt);
  
  // 4. Parse response
  let insight: Partial<TokenInsight> = {
    summary: "Unable to retrieve token information.",
    category: "other",
  };
  
  if (grokResponse) {
    try {
      // Extract JSON from response (might have extra text)
      const jsonMatch = grokResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        insight = {
          summary: parsed.summary || insight.summary,
          origin: parsed.origin?.source !== "unknown" ? parsed.origin : undefined,
          category: parsed.category || "other",
        };
      }
    } catch (error) {
      console.error("Failed to parse Grok response:", error);
      console.error("Raw response:", grokResponse?.substring(0, 500));
    }
  }
  
  // 5. Build final response
  const result: TokenInsight = {
    mint,
    symbol,
    name,
    summary: insight.summary || "Unable to retrieve token information.",
    origin: insight.origin,
    category: insight.category || "other",
    generated_at: new Date().toISOString(),
    disclaimer: "Powered by AI and may contain inaccuracies. Always do your own research.",
  };
  
  // Add market data if available
  if (tokenInfo?.priceUsd) {
    result.market = {
      price_usd: tokenInfo.priceUsd,
      market_cap: tokenInfo.marketCap || 0,
      age_days: 0, // Would need creation timestamp from chain
      liquidity: tokenInfo.liquidity || 0,
    };
  }
  
  return result;
}

// ============================================================================
// Batch Function (for trending list)
// ============================================================================

export async function getMultipleInsights(
  mints: string[]
): Promise<Map<string, TokenInsight>> {
  const results = new Map<string, TokenInsight>();
  
  // Process in parallel but with some rate limiting
  const batchSize = 3;
  for (let i = 0; i < mints.length; i += batchSize) {
    const batch = mints.slice(i, i + batchSize);
    const promises = batch.map(async (mint) => {
      const insight = await getTokenInsight(mint);
      if (insight) {
        results.set(mint, insight);
      }
    });
    await Promise.all(promises);
    
    // Small delay between batches to avoid rate limits
    if (i + batchSize < mints.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

// ============================================================================
// Check if Grok is configured
// ============================================================================

export function isInsightsAvailable(): boolean {
  return !!GROK_API_KEY;
}
