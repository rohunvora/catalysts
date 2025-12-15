// LunarCrush API Service - Social sentiment & metrics
// Docs: https://lunarcrush.com/developers/api/endpoints

import { config } from "../config";

// ============================================================================
// Types
// ============================================================================

export interface LunarCrushCoin {
  id: number;
  symbol: string;
  name: string;
  price: number;
  price_btc: number;
  market_cap: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_30d: number;
  volume_24h: number;
  
  // Social metrics
  galaxy_score: number;        // 0-100 overall social health
  alt_rank: number;            // Relative rank vs other alts
  social_volume: number;       // Total mentions
  social_volume_24h_change: number;
  social_score: number;
  social_contributors: number;
  social_dominance: number;
  
  // Sentiment
  sentiment: number;           // 0-100 (50 = neutral)
  bullish_sentiment: number;
  bearish_sentiment: number;
  
  // Engagement
  twitter_volume: number;
  twitter_volume_24h_change: number;
  reddit_volume: number;
  news_volume: number;
  
  // Influencer activity
  influencer_count: number;
  influencer_score: number;
  
  // Spam/bot detection
  spam_score: number;
  
  // Timestamps
  time_created: number;
  last_updated: number;
}

export interface LunarCrushFeed {
  id: string;
  post_type: "tweet" | "reddit" | "news" | "youtube";
  post_title?: string;
  body: string;
  post_created: number;
  creator_name: string;
  creator_display_name: string;
  creator_followers: number;
  interactions_24h: number;
  interactions_total: number;
  sentiment: number;  // 1-5 scale
  url: string;
  image_url?: string;
  symbol: string;
}

export interface LunarCrushInfluencer {
  twitter_screen_name: string;
  display_name: string;
  followers: number;
  following: number;
  engagement_rate: number;
  influencer_rank: number;
  influence_score: number;
  volume_24h: number;
  sentiment: number;
  num_posts_24h: number;
  verified: boolean;
}

export interface SocialMetricsSummary {
  symbol: string;
  galaxyScore: number;
  altRank: number;
  sentiment: number;           // 0-100
  sentimentLabel: "very_bearish" | "bearish" | "neutral" | "bullish" | "very_bullish";
  socialVolume: number;
  socialVolumeChange24h: number;
  twitterVolume: number;
  newsVolume: number;
  influencerCount: number;
  spamScore: number;
  isSpammy: boolean;
  lastUpdated: string;
}

// ============================================================================
// API Functions
// ============================================================================

const BASE_URL = config.lunarCrush.apiUrl;

/**
 * Get social metrics for a specific coin
 */
export async function getCoinMetrics(symbol: string): Promise<LunarCrushCoin | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/${symbol.toLowerCase()}`,
      {
        headers: {
          "Authorization": `Bearer ${config.lunarCrush.apiKey}`,
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`LunarCrush: Coin ${symbol} not found`);
        return null;
      }
      console.error(`LunarCrush API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data.data || null;
    
  } catch (error) {
    console.error("Error fetching LunarCrush metrics:", error);
    return null;
  }
}

/**
 * Get metrics for multiple coins at once
 */
export async function getMultipleCoinMetrics(symbols: string[]): Promise<Map<string, LunarCrushCoin>> {
  const results = new Map<string, LunarCrushCoin>();
  
  // LunarCrush API may support batch requests - check their docs
  // For now, fetch individually but in parallel
  const promises = symbols.map(async (symbol) => {
    const metrics = await getCoinMetrics(symbol);
    if (metrics) {
      results.set(symbol.toUpperCase(), metrics);
    }
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Get social feed (tweets, news, reddit) for a coin
 */
export async function getSocialFeed(
  symbol: string,
  options: {
    limit?: number;
    type?: "tweet" | "reddit" | "news" | "all";
  } = {}
): Promise<LunarCrushFeed[]> {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.type && options.type !== "all") params.set("type", options.type);
    
    const response = await fetch(
      `${BASE_URL}/coins/${symbol.toLowerCase()}/feeds?${params}`,
      {
        headers: {
          "Authorization": `Bearer ${config.lunarCrush.apiKey}`,
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error(`LunarCrush feed error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
    
  } catch (error) {
    console.error("Error fetching LunarCrush feed:", error);
    return [];
  }
}

/**
 * Get top influencers for a coin
 */
export async function getInfluencers(
  symbol: string,
  limit: number = 10
): Promise<LunarCrushInfluencer[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/${symbol.toLowerCase()}/influencers?limit=${limit}`,
      {
        headers: {
          "Authorization": `Bearer ${config.lunarCrush.apiKey}`,
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error(`LunarCrush influencers error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
    
  } catch (error) {
    console.error("Error fetching LunarCrush influencers:", error);
    return [];
  }
}

/**
 * Get trending coins by social activity
 */
export async function getTrendingCoins(limit: number = 20): Promise<LunarCrushCoin[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/coins?sort=social_volume&limit=${limit}`,
      {
        headers: {
          "Authorization": `Bearer ${config.lunarCrush.apiKey}`,
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error(`LunarCrush trending error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
    
  } catch (error) {
    console.error("Error fetching LunarCrush trending:", error);
    return [];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert raw sentiment score to label
 */
export function getSentimentLabel(sentiment: number): SocialMetricsSummary["sentimentLabel"] {
  if (sentiment < 25) return "very_bearish";
  if (sentiment < 40) return "bearish";
  if (sentiment < 60) return "neutral";
  if (sentiment < 75) return "bullish";
  return "very_bullish";
}

/**
 * Get a simplified summary of social metrics
 */
export async function getSocialSummary(symbol: string): Promise<SocialMetricsSummary | null> {
  const metrics = await getCoinMetrics(symbol);
  
  if (!metrics) {
    return null;
  }
  
  return {
    symbol: metrics.symbol,
    galaxyScore: metrics.galaxy_score || 0,
    altRank: metrics.alt_rank || 0,
    sentiment: metrics.sentiment || 50,
    sentimentLabel: getSentimentLabel(metrics.sentiment || 50),
    socialVolume: metrics.social_volume || 0,
    socialVolumeChange24h: metrics.social_volume_24h_change || 0,
    twitterVolume: metrics.twitter_volume || 0,
    newsVolume: metrics.news_volume || 0,
    influencerCount: metrics.influencer_count || 0,
    spamScore: metrics.spam_score || 0,
    isSpammy: (metrics.spam_score || 0) > 50,
    lastUpdated: new Date(metrics.last_updated * 1000).toISOString(),
  };
}

/**
 * Detect social anomalies (sudden spikes in activity)
 */
export interface SocialAnomaly {
  symbol: string;
  type: "volume_spike" | "sentiment_shift" | "influencer_surge";
  magnitude: number;  // How significant (multiplier or percentage)
  direction: "positive" | "negative";
  details: string;
  detectedAt: string;
}

export async function detectSocialAnomalies(symbol: string): Promise<SocialAnomaly[]> {
  const metrics = await getCoinMetrics(symbol);
  
  if (!metrics) {
    return [];
  }
  
  const anomalies: SocialAnomaly[] = [];
  
  // Check for volume spike (>100% increase)
  if (metrics.social_volume_24h_change > 100) {
    anomalies.push({
      symbol,
      type: "volume_spike",
      magnitude: metrics.social_volume_24h_change,
      direction: "positive",
      details: `Social volume up ${metrics.social_volume_24h_change.toFixed(0)}% in 24h`,
      detectedAt: new Date().toISOString(),
    });
  }
  
  // Check for extreme sentiment
  if (metrics.sentiment > 80) {
    anomalies.push({
      symbol,
      type: "sentiment_shift",
      magnitude: metrics.sentiment,
      direction: "positive",
      details: `Extremely bullish sentiment (${metrics.sentiment}/100)`,
      detectedAt: new Date().toISOString(),
    });
  } else if (metrics.sentiment < 20) {
    anomalies.push({
      symbol,
      type: "sentiment_shift",
      magnitude: metrics.sentiment,
      direction: "negative",
      details: `Extremely bearish sentiment (${metrics.sentiment}/100)`,
      detectedAt: new Date().toISOString(),
    });
  }
  
  // Check for influencer activity
  if (metrics.influencer_count > 50) {
    anomalies.push({
      symbol,
      type: "influencer_surge",
      magnitude: metrics.influencer_count,
      direction: "positive",
      details: `${metrics.influencer_count} influencers discussing`,
      detectedAt: new Date().toISOString(),
    });
  }
  
  return anomalies;
}

/**
 * Get high-signal posts (filtered by engagement and sentiment)
 */
export interface HighSignalPost {
  id: string;
  type: string;
  author: string;
  authorFollowers: number;
  content: string;
  sentiment: "bullish" | "bearish" | "neutral";
  engagement: number;
  url: string;
  postedAt: string;
}

export async function getHighSignalPosts(
  symbol: string,
  options: {
    minEngagement?: number;
    minFollowers?: number;
    sentimentFilter?: "bullish" | "bearish";
    limit?: number;
  } = {}
): Promise<HighSignalPost[]> {
  const feed = await getSocialFeed(symbol, { limit: 50 });
  
  const minEngagement = options.minEngagement || 100;
  const minFollowers = options.minFollowers || 1000;
  
  return feed
    .filter(post => {
      // Filter by engagement
      if (post.interactions_24h < minEngagement) return false;
      
      // Filter by author followers
      if (post.creator_followers < minFollowers) return false;
      
      // Filter by sentiment if specified
      if (options.sentimentFilter) {
        const postSentiment = post.sentiment >= 4 ? "bullish" : post.sentiment <= 2 ? "bearish" : "neutral";
        if (postSentiment !== options.sentimentFilter) return false;
      }
      
      return true;
    })
    .slice(0, options.limit || 10)
    .map(post => ({
      id: post.id,
      type: post.post_type,
      author: post.creator_name,
      authorFollowers: post.creator_followers,
      content: post.body,
      sentiment: post.sentiment >= 4 ? "bullish" : post.sentiment <= 2 ? "bearish" : "neutral",
      engagement: post.interactions_24h,
      url: post.url,
      postedAt: new Date(post.post_created * 1000).toISOString(),
    }));
}

// ============================================================================
// Catalyst Generation from Social Data
// ============================================================================

import { CatalystCard, EventType, Severity, Direction } from "@/types/catalyst";

/**
 * Generate catalyst cards from significant social events
 */
export async function generateSocialCatalysts(
  symbol: string,
  mint: string
): Promise<CatalystCard[]> {
  const catalysts: CatalystCard[] = [];
  
  // Get social summary
  const summary = await getSocialSummary(symbol);
  if (!summary) return catalysts;
  
  // Get high-signal posts
  const posts = await getHighSignalPosts(symbol, { minEngagement: 500, limit: 5 });
  
  // Generate catalyst for each significant post
  for (const post of posts) {
    const now = new Date().toISOString();
    
    const direction: Direction = post.sentiment === "bullish" ? "BULLISH" : 
                                  post.sentiment === "bearish" ? "BEARISH" : "NEUTRAL";
    
    catalysts.push({
      id: `solana:${symbol}:${now}:SOCIAL_MATERIAL`,
      dedupe_key: `${symbol.toLowerCase()}-social-${post.id}`,
      asset: {
        chain: "solana",
        mint,
        symbol,
      },
      ts: post.postedAt,
      first_seen: now,
      event_type: "SOCIAL_MATERIAL",
      severity: post.engagement > 5000 ? "HIGH" : post.engagement > 1000 ? "MED" : "LOW",
      time_horizon: "SWING",
      direction,
      headline: `${post.author} (${(post.authorFollowers / 1000).toFixed(0)}K followers): "${post.content.slice(0, 60)}..."`,
      key_numbers: [
        { label: "engagement", value: post.engagement, unit: "interactions" },
        { label: "followers", value: post.authorFollowers, unit: "followers" },
      ],
      so_what: [
        `High-engagement ${post.type} from influential account.`,
        `Overall ${symbol} sentiment: ${summary.sentimentLabel.replace("_", " ")} (${summary.sentiment}/100)`,
      ],
      confidence: Math.min(0.9, 0.5 + (post.engagement / 10000)),
      source_count: 1,
      evidence: [
        {
          kind: "official_post",
          ref: post.id,
          explorer_url: post.url,
          label: `${post.type} by @${post.author}`,
        },
      ],
      simulated: false,
    });
  }
  
  // Generate catalyst for social volume spike
  if (summary.socialVolumeChange24h > 100) {
    const now = new Date().toISOString();
    
    catalysts.push({
      id: `solana:${symbol}:${now}:SOCIAL_SPIKE`,
      dedupe_key: `${symbol.toLowerCase()}-social-spike-${Date.now()}`,
      asset: {
        chain: "solana",
        mint,
        symbol,
      },
      ts: now,
      first_seen: now,
      event_type: "SOCIAL_MATERIAL",
      severity: summary.socialVolumeChange24h > 500 ? "HIGH" : "MED",
      time_horizon: "INTRADAY",
      direction: summary.sentiment > 60 ? "BULLISH" : summary.sentiment < 40 ? "BEARISH" : "NEUTRAL",
      headline: `${symbol} social volume up ${summary.socialVolumeChange24h.toFixed(0)}% in 24h`,
      key_numbers: [
        { label: "volume_change", value: summary.socialVolumeChange24h, unit: "%" },
        { label: "sentiment", value: summary.sentiment, unit: "/100" },
        { label: "galaxy_score", value: summary.galaxyScore, unit: "/100" },
      ],
      so_what: [
        "Sudden social volume spike often precedes price volatility.",
        `${summary.twitterVolume} Twitter mentions, ${summary.influencerCount} influencers discussing.`,
      ],
      confidence: 0.75,
      source_count: 1,
      evidence: [
        {
          kind: "api_source",
          ref: "lunarcrush-metrics",
          explorer_url: `https://lunarcrush.com/coin/${symbol.toLowerCase()}`,
          label: "LunarCrush",
        },
      ],
      simulated: false,
    });
  }
  
  return catalysts;
}

