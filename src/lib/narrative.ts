// LLM-powered narrative extraction from tweets

import { Tweet } from "./twitter";
import { CatalystCard, EventType, Severity, TimeHorizon } from "@/types/catalyst";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface NarrativeAnalysis {
  // What is this token?
  narrative: {
    summary: string;      // 1-2 sentence explanation of what the token is
    category: string;     // "memecoin", "defi", "ai", "gaming", etc.
    thesis: string;       // Why would someone buy this?
    risk_factors: string[]; // Key risks
  };
  
  // What's the latest catalyst?
  latest_catalyst: {
    headline: string;
    event_type: EventType;
    severity: Severity;
    time_horizon: TimeHorizon;
    why_it_matters: string[];
    confidence: number;
  } | null;
  
  // Supporting evidence
  key_tweets: string[];   // Most important tweet texts
  sources: string[];      // Tweet URLs
}

// Analyze tweets to extract narrative using Claude
export async function analyzeNarrativeWithClaude(
  symbol: string,
  name: string,
  tweets: Tweet[]
): Promise<NarrativeAnalysis | null> {
  if (!ANTHROPIC_API_KEY) {
    console.log("No Anthropic API key, skipping narrative analysis");
    return null;
  }
  
  const tweetTexts = tweets.map(t => ({
    text: t.text,
    author: t.author_username,
    date: t.created_at,
    likes: t.public_metrics?.like_count || 0,
  }));
  
  const prompt = `You are a crypto analyst. Analyze these tweets about the token "${symbol}" (${name}) and extract:

1. NARRATIVE: What is this token? What's the story/thesis? Why would someone trade it?
2. LATEST CATALYST: What's the most important recent event or development mentioned?
3. RISKS: What are the key risk factors?

Tweets (sorted by engagement):
${JSON.stringify(tweetTexts, null, 2)}

Respond in this exact JSON format:
{
  "narrative": {
    "summary": "1-2 sentence explanation of what this token is",
    "category": "memecoin|defi|ai|gaming|infrastructure|other",
    "thesis": "The bull case - why would someone buy this?",
    "risk_factors": ["risk 1", "risk 2"]
  },
  "latest_catalyst": {
    "headline": "Short headline of the most important recent event",
    "event_type": "WHALE_FLOW|LIQUIDITY_CHANGE|SUPPLY_FLOAT|PRIVILEGE_CHANGE|INCIDENT|LISTING_STATUS|TEAM_SHIP|SOCIAL_MATERIAL",
    "severity": "LOW|MED|HIGH",
    "time_horizon": "INTRADAY|SWING|LONGER",
    "why_it_matters": ["bullet 1", "bullet 2"],
    "confidence": 0.0-1.0
  },
  "key_tweets": ["most important tweet text 1", "most important tweet text 2"],
  "sources": ["tweet url 1", "tweet url 2"]
}

If there's no clear catalyst in the tweets, set latest_catalyst to null.
Only include factual information from the tweets, don't make things up.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    
    if (!response.ok) {
      console.error("Claude API error:", await response.text());
      return null;
    }
    
    const data = await response.json();
    const content = data.content[0]?.text;
    
    if (!content) return null;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    return JSON.parse(jsonMatch[0]) as NarrativeAnalysis;
    
  } catch (error) {
    console.error("Narrative analysis failed:", error);
    return null;
  }
}

// Analyze tweets to extract narrative using GPT-4
export async function analyzeNarrativeWithOpenAI(
  symbol: string,
  name: string,
  tweets: Tweet[]
): Promise<NarrativeAnalysis | null> {
  if (!OPENAI_API_KEY) {
    console.log("No OpenAI API key, skipping narrative analysis");
    return null;
  }
  
  const tweetTexts = tweets.map(t => ({
    text: t.text,
    author: t.author_username,
    date: t.created_at,
    likes: t.public_metrics?.like_count || 0,
  }));
  
  const prompt = `Analyze these tweets about "${symbol}" (${name}) and extract the narrative and latest catalyst.

Tweets:
${JSON.stringify(tweetTexts, null, 2)}

Return JSON with:
- narrative.summary: What is this token? (1-2 sentences)
- narrative.category: memecoin/defi/ai/gaming/infrastructure/other
- narrative.thesis: Bull case for buying
- narrative.risk_factors: Array of risks
- latest_catalyst: Most important recent event (headline, event_type, severity, time_horizon, why_it_matters array, confidence 0-1)
- key_tweets: Array of most important tweet texts
- sources: Array of tweet URLs

Event types: WHALE_FLOW, LIQUIDITY_CHANGE, SUPPLY_FLOAT, PRIVILEGE_CHANGE, INCIDENT, LISTING_STATUS, TEAM_SHIP, SOCIAL_MATERIAL
Severity: LOW, MED, HIGH
Time horizon: INTRADAY, SWING, LONGER`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    
    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return null;
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) return null;
    
    return JSON.parse(content) as NarrativeAnalysis;
    
  } catch (error) {
    console.error("Narrative analysis failed:", error);
    return null;
  }
}

// Rule-based narrative extraction (fallback when no LLM available)
export function extractNarrativeRuleBased(
  symbol: string,
  name: string,
  tweets: Tweet[]
): NarrativeAnalysis | null {
  if (tweets.length === 0) return null;
  
  const allText = tweets.map(t => t.text).join(" ").toLowerCase();
  
  // Detect category
  let category = "other";
  if (/\b(meme|doge|pepe|frog|cat|dog|shib|bonk|popcat)\b/.test(allText)) {
    category = "memecoin";
  } else if (/\b(defi|swap|amm|lp|liquidity|yield|farm|stake)\b/.test(allText)) {
    category = "defi";
  } else if (/\b(ai|artificial\s*intelligence|gpt|agent|ml|model)\b/.test(allText)) {
    category = "ai";
  } else if (/\b(game|gaming|nft|play|metaverse)\b/.test(allText)) {
    category = "gaming";
  } else if (/\b(infra|layer|chain|bridge|oracle)\b/.test(allText)) {
    category = "infrastructure";
  }
  
  // Detect event type from tweets
  let eventType: EventType = "SOCIAL_MATERIAL";
  let headline = `Community activity around ${symbol}`;
  let severity: Severity = "LOW";
  let timeHorizon: TimeHorizon = "SWING";
  
  if (/\b(whale|large\s*(buy|sell|transfer)|million|billion)\b/.test(allText)) {
    eventType = "WHALE_FLOW";
    headline = `Whale activity detected for ${symbol}`;
    severity = "MED";
    timeHorizon = "INTRADAY";
  } else if (/\b(list(ed|ing)|exchange|binance|coinbase|bybit|kraken)\b/.test(allText)) {
    eventType = "LISTING_STATUS";
    headline = `Exchange listing news for ${symbol}`;
    severity = "HIGH";
    timeHorizon = "SWING";
  } else if (/\b(launch|release|mainnet|upgrade|v\d|deploy)\b/.test(allText)) {
    eventType = "TEAM_SHIP";
    headline = `Development update for ${symbol}`;
    severity = "MED";
    timeHorizon = "SWING";
  } else if (/\b(liquidity|lp|pool|depth|removed|added)\b/.test(allText)) {
    eventType = "LIQUIDITY_CHANGE";
    headline = `Liquidity change detected for ${symbol}`;
    severity = "MED";
    timeHorizon = "INTRADAY";
  } else if (/\b(hack|exploit|rug|scam|vulnerability|incident)\b/.test(allText)) {
    eventType = "INCIDENT";
    headline = `⚠️ Security alert for ${symbol}`;
    severity = "HIGH";
    timeHorizon = "INTRADAY";
  } else if (/\b(burn|lock|unlock|supply|mint|emission)\b/.test(allText)) {
    eventType = "SUPPLY_FLOAT";
    headline = `Supply change for ${symbol}`;
    severity = "MED";
    timeHorizon = "SWING";
  }
  
  // Build risk factors
  const riskFactors: string[] = [];
  if (category === "memecoin") {
    riskFactors.push("High volatility typical of memecoins");
    riskFactors.push("Value driven by community sentiment");
  }
  if (/\b(new|launch|recent)\b/.test(allText)) {
    riskFactors.push("Relatively new token - limited track record");
  }
  if (/\b(pump|moon|100x)\b/.test(allText)) {
    riskFactors.push("High speculation in community discourse");
  }
  if (/\b(low\s*liquidity|thin)\b/.test(allText)) {
    riskFactors.push("Potential liquidity concerns");
  }
  if (riskFactors.length === 0) {
    riskFactors.push("Standard crypto market risks apply");
  }
  
  // Find best tweets (by engagement)
  const sortedTweets = [...tweets].sort((a, b) => {
    const aScore = (a.public_metrics?.like_count || 0) + (a.public_metrics?.retweet_count || 0) * 2;
    const bScore = (b.public_metrics?.like_count || 0) + (b.public_metrics?.retweet_count || 0) * 2;
    return bScore - aScore;
  });
  
  const keyTweets = sortedTweets.slice(0, 3).map(t => t.text);
  const sources = sortedTweets.slice(0, 3).map(t => 
    `https://x.com/${t.author_username || "i"}/status/${t.id}`
  );
  
  // Build summary from most engaged tweets
  const topTweet = sortedTweets[0];
  let summary = `${name || symbol} is a Solana token with active community discussion.`;
  if (topTweet) {
    // Extract a cleaner summary from the top tweet
    const cleanText = topTweet.text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/@\w+/g, "")
      .replace(/#\w+/g, "")
      .trim();
    if (cleanText.length > 20) {
      summary = cleanText.length > 150 ? cleanText.substring(0, 147) + "..." : cleanText;
    }
  }
  
  // Build thesis
  let thesis = `Community engagement suggests interest in ${symbol}.`;
  if (category === "memecoin") {
    thesis = `${symbol} has memecoin characteristics with community-driven momentum.`;
  } else if (category === "defi") {
    thesis = `${symbol} appears to be a DeFi-related token with potential utility.`;
  } else if (category === "ai") {
    thesis = `${symbol} is positioned in the AI/crypto intersection space.`;
  }
  
  // Build "why it matters"
  const whyItMatters: string[] = [];
  if (eventType === "WHALE_FLOW") {
    whyItMatters.push("Large wallet movements often precede price volatility");
    whyItMatters.push("Watch for follow-through in the next 24 hours");
  } else if (eventType === "LISTING_STATUS") {
    whyItMatters.push("Exchange listings typically increase liquidity and exposure");
    whyItMatters.push("Initial listing can be 'buy rumor, sell news' - watch price action");
  } else if (eventType === "TEAM_SHIP") {
    whyItMatters.push("Development activity signals continued project commitment");
    whyItMatters.push("New features may drive usage and token demand");
  } else {
    whyItMatters.push(`Active community discussion around ${symbol}`);
    whyItMatters.push("Monitor for material developments");
  }
  
  return {
    narrative: {
      summary,
      category,
      thesis,
      risk_factors: riskFactors,
    },
    latest_catalyst: {
      headline,
      event_type: eventType,
      severity,
      time_horizon: timeHorizon,
      why_it_matters: whyItMatters,
      confidence: 0.6,
    },
    key_tweets: keyTweets,
    sources,
  };
}

// Pre-filter tweets to only those clearly about our token
function filterTweetsForToken(tweets: Tweet[], symbol: string, name: string): Tweet[] {
  const cleanSymbol = symbol.toLowerCase().replace(/^\$/, "");
  const nameWords = name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  return tweets.filter(tweet => {
    const text = tweet.text.toLowerCase();
    
    // REJECT: Airdrop mentions are almost always scams
    if (/\bairdrop\b/i.test(text) || /\bclaim\b.*\b(your|free|now)\b/i.test(text)) {
      console.log(`[Narrative filter] Rejected airdrop scam: ${text.substring(0, 50)}...`);
      return false;
    }
    
    // Must contain the symbol with $ or as standalone word
    const hasCashtag = text.includes(`$${cleanSymbol}`);
    const hasStandaloneSymbol = new RegExp(`\\b${cleanSymbol}\\b`, 'i').test(text);
    
    // Must contain significant name words (e.g., "Turtle" from "Franklin The Turtle")
    const hasNameContext = nameWords.length === 0 || 
      nameWords.filter(word => text.includes(word)).length >= Math.min(2, nameWords.length);
    
    // Reject if tweet is promoting a DIFFERENT token
    // Look for "CA:" patterns with different tokens
    if (/ca[:\s]*[1-9a-z]{32,44}/i.test(text)) {
      // If promoting any CA, check if the tweet actually talks about our token
      if (!hasCashtag && !hasNameContext) {
        console.log(`[Narrative filter] Rejected CA promotion: ${text.substring(0, 50)}...`);
        return false;
      }
    }
    
    // Reject if tweet is primarily about OTHER tokens
    const otherCashtags = (tweet.text.match(/\$[A-Za-z]{2,10}/g) || [])
      .filter(tag => tag.toLowerCase() !== `$${cleanSymbol}`);
    if (otherCashtags.length >= 2 && !hasCashtag) {
      console.log(`[Narrative filter] Rejected (multiple other tokens): ${text.substring(0, 50)}...`);
      return false;
    }
    
    // Must have SOME connection to our token
    if (!hasCashtag && !hasStandaloneSymbol && !hasNameContext) {
      console.log(`[Narrative filter] No token mention: ${text.substring(0, 50)}...`);
      return false;
    }
    
    return true;
  });
}

// Main function: try Claude first, fall back to OpenAI, then rule-based
export async function extractNarrative(
  symbol: string,
  name: string,
  tweets: Tweet[]
): Promise<NarrativeAnalysis | null> {
  if (tweets.length === 0) {
    return null;
  }
  
  // CRITICAL: Pre-filter tweets to only those actually about our token
  const filteredTweets = filterTweetsForToken(tweets, symbol, name);
  console.log(`Narrative extraction: ${tweets.length} → ${filteredTweets.length} after token filter`);
  
  if (filteredTweets.length === 0) {
    console.log("No relevant tweets found for narrative extraction");
    return {
      narrative: {
        summary: `${name || symbol} is a Solana token. Limited recent social activity found.`,
        category: "other",
        thesis: `${symbol} token on Solana. Insufficient data for detailed analysis.`,
        risk_factors: ["Limited social data available", "Standard crypto market risks apply"],
      },
      latest_catalyst: null,
      key_tweets: [],
      sources: [],
    };
  }
  
  // Try Claude first (cheaper for this use case)
  let analysis = await analyzeNarrativeWithClaude(symbol, name, filteredTweets);
  
  // Fall back to OpenAI
  if (!analysis) {
    analysis = await analyzeNarrativeWithOpenAI(symbol, name, filteredTweets);
  }
  
  // Final fallback: rule-based extraction
  if (!analysis) {
    console.log("Using rule-based narrative extraction (no LLM API key available)");
    analysis = extractNarrativeRuleBased(symbol, name, filteredTweets);
  }
  
  return analysis;
}

// Convert narrative analysis to a formatted catalyst card
export function narrativeToCatalystCard(
  analysis: NarrativeAnalysis,
  symbol: string,
  mint: string
): CatalystCard | null {
  if (!analysis.latest_catalyst) return null;
  
  const now = new Date().toISOString();
  
  return {
    id: `solana:${symbol}:${now}:${analysis.latest_catalyst.event_type}:narrative`,
    dedupe_key: `${symbol.toLowerCase()}-narrative-${Date.now()}`,
    asset: {
      chain: "solana",
      mint,
      symbol,
    },
    ts: now,
    first_seen: now,
    event_type: analysis.latest_catalyst.event_type,
    severity: analysis.latest_catalyst.severity,
    time_horizon: analysis.latest_catalyst.time_horizon,
    headline: analysis.latest_catalyst.headline,
    key_numbers: [],
    so_what: analysis.latest_catalyst.why_it_matters,
    confidence: analysis.latest_catalyst.confidence,
    source_count: analysis.sources.length,
    evidence: analysis.sources.map(url => ({
      kind: "official_post" as const,
      ref: url,
      explorer_url: url,
      label: url.includes("x.com") ? "X post" : "Source",
    })),
    simulated: false,
  };
}

