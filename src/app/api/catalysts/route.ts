import { NextRequest, NextResponse } from "next/server";
import { CatalystCard } from "@/types/catalyst";
import { config, isServiceConfigured } from "@/lib/config";

// Import new services
import { 
  getTokenWithMarketData, 
  getTokenInfo,
  TokenInfo 
} from "@/lib/services/token-registry";
import { 
  getTokenPrice, 
  detectPriceAnomaly,
  recordPrice 
} from "@/lib/services/jupiter";
import { 
  generateSocialCatalysts,
  getSocialSummary 
} from "@/lib/services/lunarcrush";
import {
  detectAndCorrelateSingle,
  refreshCatalystBuffer,
  priceAlertToCatalystCard,
  bufferCatalyst,
} from "@/lib/services/correlation";

// Legacy imports (still used for Twitter)
import { searchTokenTweets } from "@/lib/twitter";
import { generateCatalystFromNews, rankNewsByRelevance, RawNewsItem } from "@/lib/catalyst-generator";

// Simple in-memory cache
const cache = new Map<string, { data: CatalystCard[]; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes (shorter for more real-time data)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mint = searchParams.get("mint");
  const skipCache = searchParams.get("refresh") === "true";
  const detectPrice = searchParams.get("detect_price") === "true";
  
  if (!mint) {
    return NextResponse.json(
      { error: "Missing 'mint' parameter. Provide a Solana token mint address." },
      { status: 400 }
    );
  }
  
  // Validate mint address format
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) {
    return NextResponse.json(
      { error: "Invalid mint address format. Must be a valid Solana address." },
      { status: 400 }
    );
  }
  
  // Check cache
  if (!skipCache) {
    const cached = cache.get(mint);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        mint,
        catalysts: cached.data,
        cached: true,
        generated_at: new Date(cached.timestamp).toISOString(),
      });
    }
  }
  
  try {
    // Step 1: Get token info from dynamic registry
    const tokenInfo = await getTokenWithMarketData(mint);
    
    if (!tokenInfo) {
      // Try basic lookup
      const basicInfo = await getTokenInfo(mint);
      if (!basicInfo) {
        return NextResponse.json({
          mint,
          catalysts: [],
          message: "Token not found. It may be a new or unlisted token.",
          solscan_url: `https://solscan.io/token/${mint}`,
        });
      }
    }
    
    const symbol = tokenInfo?.symbol || "UNKNOWN";
    const name = tokenInfo?.name;
    const priceUsd = tokenInfo?.priceUsd;
    
    console.log(`Processing ${symbol} (${mint}) - Price: $${priceUsd?.toFixed(6) || "unknown"}`);
    
    const catalysts: CatalystCard[] = [];
    const sources = {
      twitter: 0,
      lunarcrush: 0,
      onchain: 0,
      price_alerts: 0,
    };
    
    // Step 2: Record current price for anomaly detection
    if (priceUsd) {
      recordPrice(mint, priceUsd);
    }
    
    // Step 3: Get social catalysts from LunarCrush (if configured)
    if (isServiceConfigured("lunarCrush")) {
      try {
        const socialCatalysts = await generateSocialCatalysts(symbol, mint);
        catalysts.push(...socialCatalysts);
        sources.lunarcrush = socialCatalysts.length;
        
        // Buffer for correlation
        socialCatalysts.forEach(c => bufferCatalyst(c));
        
        console.log(`LunarCrush: ${socialCatalysts.length} catalysts`);
      } catch (error) {
        console.error("LunarCrush error:", error);
      }
    }
    
    // Step 4: Search Twitter (if configured)
    if (isServiceConfigured("twitter")) {
      try {
        const twitterResults = await searchTokenTweets(mint, symbol, name);
        console.log(`Twitter: ${twitterResults.length} tweets found`);
        
        // Rank and convert to catalysts
        const rankedNews = rankNewsByRelevance(twitterResults, symbol);
        const twitterCatalysts = rankedNews
          .slice(0, 5)
          .map(news => generateCatalystFromNews(news, symbol, mint));
        
        catalysts.push(...twitterCatalysts);
        sources.twitter = twitterCatalysts.length;
        
        // Buffer for correlation
        twitterCatalysts.forEach(c => bufferCatalyst(c));
        
      } catch (error) {
        console.error("Twitter error:", error);
      }
    }
    
    // Step 5: Detect price anomalies and correlate (if requested)
    if (detectPrice && priceUsd) {
      try {
        const alert = await detectAndCorrelateSingle(mint, symbol, 10);
        
        if (alert) {
          const alertCard = priceAlertToCatalystCard(alert);
          catalysts.unshift(alertCard); // Add to front
          sources.price_alerts = 1;
          console.log(`Price alert: ${alert.summary}`);
        }
      } catch (error) {
        console.error("Price detection error:", error);
      }
    }
    
    // Sort by timestamp (most recent first)
    catalysts.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    
    // Deduplicate by dedupe_key
    const seen = new Set<string>();
    const dedupedCatalysts = catalysts.filter(c => {
      if (seen.has(c.dedupe_key)) return false;
      seen.add(c.dedupe_key);
      return true;
    });
    
    // Cache results
    cache.set(mint, { data: dedupedCatalysts, timestamp: Date.now() });
    
    // Build response
    const response: Record<string, unknown> = {
      mint,
      symbol,
      name,
      catalysts: dedupedCatalysts,
      catalyst_count: dedupedCatalysts.length,
      sources,
      generated_at: new Date().toISOString(),
      solscan_url: `https://solscan.io/token/${mint}`,
    };
    
    // Add market data if available
    if (tokenInfo) {
      response.market_data = {
        price_usd: tokenInfo.priceUsd,
        market_cap: tokenInfo.marketCap,
        volume_24h: tokenInfo.volume24h,
        price_change_24h: tokenInfo.priceChange24h,
        liquidity: tokenInfo.liquidity,
      };
    }
    
    // Add social summary if available
    if (isServiceConfigured("lunarCrush")) {
      try {
        const socialSummary = await getSocialSummary(symbol);
        if (socialSummary) {
          response.social_data = {
            galaxy_score: socialSummary.galaxyScore,
            sentiment: socialSummary.sentiment,
            sentiment_label: socialSummary.sentimentLabel,
            social_volume: socialSummary.socialVolume,
            social_volume_change_24h: socialSummary.socialVolumeChange24h,
          };
        }
      } catch (error) {
        console.error("Social summary error:", error);
      }
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Error generating catalysts:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate catalysts. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST endpoint for submitting raw data to parse
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mint, raw_text, source_url, source_name } = body;
    
    if (!mint || !raw_text) {
      return NextResponse.json(
        { error: "Missing required fields: 'mint' and 'raw_text'" },
        { status: 400 }
      );
    }
    
    // Get token info
    const tokenInfo = await getTokenInfo(mint);
    const symbol = tokenInfo?.symbol || "UNKNOWN";
    
    // Create news item from raw input
    const newsItem: RawNewsItem = {
      title: raw_text.substring(0, 100),
      snippet: raw_text,
      url: source_url || `https://solscan.io/token/${mint}`,
      source: source_name || "User Submitted",
      date: new Date().toISOString(),
    };
    
    // Generate catalyst card
    const catalyst = generateCatalystFromNews(newsItem, symbol, mint);
    
    // Add to buffer for correlation
    bufferCatalyst(catalyst);
    
    return NextResponse.json({
      mint,
      symbol,
      catalyst,
      message: "Catalyst generated and added to correlation buffer",
    });
    
  } catch (error) {
    console.error("Error processing POST:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
