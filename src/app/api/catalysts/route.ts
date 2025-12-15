import { NextRequest, NextResponse } from "next/server";
import { fetchTokenInfo, solscanTokenUrl } from "@/lib/solana";
import { generateCatalystFromNews, rankNewsByRelevance, RawNewsItem } from "@/lib/catalyst-generator";
import { searchTokenTweets } from "@/lib/twitter";
import { CatalystCard } from "@/types/catalyst";

// Simple in-memory cache (use Redis in production)
const cache = new Map<string, { data: CatalystCard[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mint = searchParams.get("mint");
  const skipCache = searchParams.get("refresh") === "true";
  
  if (!mint) {
    return NextResponse.json(
      { error: "Missing 'mint' parameter. Provide a Solana token mint address." },
      { status: 400 }
    );
  }
  
  // Validate mint address format (base58, 32-44 chars)
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
    // Step 1: Get token info from DexScreener
    const tokenInfo = await fetchTokenInfo(mint);
    
    if (!tokenInfo) {
      return NextResponse.json({
        mint,
        catalysts: [],
        message: "Token not found. It may be a new or unlisted token with no trading pairs.",
        solscan_url: solscanTokenUrl(mint),
      });
    }
    
    const { symbol, name } = tokenInfo;
    
    // Step 2: Search Twitter for mentions of this token
    console.log(`Searching Twitter for ${symbol} (${mint})...`);
    const twitterResults = await searchTokenTweets(mint, symbol, name);
    console.log(`Found ${twitterResults.length} tweets`);
    
    // Step 3: Combine all news sources
    const allNews: RawNewsItem[] = [...twitterResults];
    
    // Step 4: Rank and filter by relevance
    const rankedNews = rankNewsByRelevance(allNews, symbol);
    
    // Step 5: Generate catalyst cards
    const catalysts: CatalystCard[] = rankedNews
      .slice(0, 10) // Max 10 catalysts
      .map(news => generateCatalystFromNews(news, symbol, mint));
    
    // Cache results
    cache.set(mint, { data: catalysts, timestamp: Date.now() });
    
    return NextResponse.json({
      mint,
      symbol,
      name,
      catalysts,
      catalyst_count: catalysts.length,
      sources: {
        twitter: twitterResults.length,
      },
      generated_at: new Date().toISOString(),
      solscan_url: solscanTokenUrl(mint),
    });
    
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
    const tokenInfo = await fetchTokenInfo(mint);
    const symbol = tokenInfo?.symbol || "UNKNOWN";
    
    // Create news item from raw input
    const newsItem: RawNewsItem = {
      title: raw_text.substring(0, 100),
      snippet: raw_text,
      url: source_url || solscanTokenUrl(mint),
      source: source_name || "User Submitted",
      date: new Date().toISOString(),
    };
    
    // Generate catalyst card
    const catalyst = generateCatalystFromNews(newsItem, symbol, mint);
    
    return NextResponse.json({
      mint,
      symbol,
      catalyst,
      message: "Catalyst generated from submitted text",
    });
    
  } catch (error) {
    console.error("Error processing POST:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
