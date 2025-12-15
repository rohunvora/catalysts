import { NextRequest, NextResponse } from "next/server";
import { fetchTokenInfo, solscanTokenUrl } from "@/lib/solana";
import { generateCatalystFromNews, rankNewsByRelevance, RawNewsItem } from "@/lib/catalyst-generator";
import { searchTokenTweets, searchTwitterRaw } from "@/lib/twitter";
import { CatalystCard } from "@/types/catalyst";
import { extractNarrative, narrativeToCatalystCard } from "@/lib/narrative";

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
    
    // Step 2: Search Twitter for raw tweets (for narrative analysis)
    console.log(`Searching Twitter for ${symbol} (${mint})...`);
    const rawTweets = await searchTwitterRaw(symbol, name, 30);
    console.log(`Found ${rawTweets.tweets.length} raw tweets`);
    
    // Step 3: Extract narrative using LLM
    console.log("Extracting narrative with LLM...");
    const narrative = await extractNarrative(symbol, name, rawTweets.tweets);
    
    // Step 4: Also get filtered tweets for traditional catalyst cards
    const twitterResults = await searchTokenTweets(mint, symbol, name);
    console.log(`Found ${twitterResults.length} filtered tweets`);
    
    // Step 5: Combine all news sources
    const allNews: RawNewsItem[] = [...twitterResults];
    
    // Step 6: Rank and filter by relevance
    const rankedNews = rankNewsByRelevance(allNews, symbol);
    
    // Step 7: Generate catalyst cards from filtered tweets
    const tweetCatalysts: CatalystCard[] = rankedNews
      .slice(0, 10)
      .map(news => generateCatalystFromNews(news, symbol, mint));
    
    // Step 8: If we have narrative analysis with a catalyst, add it as the top card
    const catalysts: CatalystCard[] = [];
    if (narrative?.latest_catalyst) {
      const narrativeCard = narrativeToCatalystCard(narrative, symbol, mint);
      if (narrativeCard) {
        catalysts.push(narrativeCard);
      }
    }
    catalysts.push(...tweetCatalysts);
    
    // Cache results
    cache.set(mint, { data: catalysts, timestamp: Date.now() });
    
    return NextResponse.json({
      mint,
      symbol,
      name,
      // NARRATIVE: What is this token?
      narrative: narrative?.narrative || null,
      // LATEST CATALYST: What's the most important recent event?
      latest_catalyst: narrative?.latest_catalyst || null,
      // All catalyst cards (narrative card first if available)
      catalysts,
      catalyst_count: catalysts.length,
      sources: {
        twitter: rawTweets.tweets.length,
        filtered: twitterResults.length,
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
